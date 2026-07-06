import { Draw } from 'ol/interaction'
import { Vector as VectorSource } from 'ol/source'
import { toLonLat } from 'ol/proj'
import uuid from '../../../../shared/uuid'
import { militaryFormat } from '../../../../shared/datetime'
import * as ID from '../../../ids'
import { ElevationService } from '../../../model/ElevationService'
import { ViewshedEngine, VISIBLE, NO_DATA } from '../area-of-sight/engine'
import { DEFAULT_RADIUS_M, MAX_RADIUS_M } from '../area-of-sight'
import { rasterizePolygon, findCandidates, greedySiting } from './solve'
import { polygonOf } from './geometry'
import GeometryType from '../GeometryType'

const ORIGINATOR_ID = uuid()

const TARGET_COVERAGE = 0.95 // stop when this fraction of the area is visible
const MAX_OBSERVERS = 12
const MIN_GAIN = 0.01 // stop when the best candidate adds < 1 % of the area
const MIN_SPACING_M = 250 // initial candidate block size
const MAX_CANDIDATES = 120
const RADIUS_STEP_M = 250
const MIN_RADIUS_M = 250
const DEFAULT_OBSERVER_HEIGHT_M = 2
const DEFAULT_TARGET_HEIGHT_M = 2

const formatRadius = radiusM =>
  radiusM >= 1000 ? `${(radiusM / 1000).toFixed(2)} km` : `${radiusM} m`

/**
 * Observer siting: given an area (drawn or selected polygon), find a
 * small set of observer positions inside it whose combined viewsheds
 * cover as much of the area as possible (greedy max-coverage over
 * candidate viewsheds, computed by the shared WebGPU engine).
 *
 * The chosen positions are inserted as regular AoS documents — their
 * viewsheds render through the standard pipeline and each observer
 * stays individually editable and deletable.
 */
export default ({ map, services }) => {
  const elevationService = new ElevationService()
  const engine = new ViewshedEngine()

  let drawInteraction = null
  let generation = 0
  let running = false
  let radiusM = DEFAULT_RADIUS_M
  let pendingPolygon = null // selected polygon, waiting for radius confirmation

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  const cancelDraw = () => {
    if (!drawInteraction) return
    drawInteraction.abortDrawing()
    map.removeInteraction(drawInteraction)
    drawInteraction = null
  }

  /**
   * @returns {{ polygon: Polygon } | { unsuitable: true } | null}
   *   polygon: selected feature usable as area (polygon or closed line)
   *   unsuitable: something is selected but cannot serve as an area
   *   null: nothing selected
   */
  const findSelectedArea = () => {
    const selectedIds = services.selection.selected()
    if (selectedIds.length !== 1) return null
    const layers = map.getLayerGroup().getLayersArray()
    for (const layer of layers) {
      if (typeof layer.getSource !== 'function') continue
      const source = layer.getSource()
      if (typeof source?.getFeatureById !== 'function') continue
      const feature = source.getFeatureById(selectedIds[0])
      if (!feature) continue
      const polygon = polygonOf(feature.getGeometry())
      return polygon ? { polygon } : { unsuitable: true }
    }
    return null
  }

  const run = async (polygon) => {
    const gen = ++generation
    const cancelled = () => gen !== generation
    running = true
    try {
      await solveArea(polygon, gen, cancelled)
    } finally {
      if (!cancelled()) running = false
    }
  }

  const solveArea = async (polygon, gen, cancelled) => {

    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }

    const defaults = await services.sessionStore.get('tools.aos', {})
    const observerHeight = defaults.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M
    const targetHeight = defaults.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
    services.sessionStore.put('tools.aos', { ...defaults, radius: radiusM })

    showOSD('Observer siting: loading terrain …')

    const extent = polygon.getExtent()
    const margin = 100 // sight lines between points inside stay within the hull
    const grid = await elevationService.getGrid([
      extent[0] - margin, extent[1] - margin, extent[2] + margin, extent[3] + margin
    ])
    if (cancelled()) return
    if (!grid) {
      showOSD('Observer siting: area too large or no terrain')
      setTimeout(() => showOSD(''), 3000)
      return
    }
    for (let i = 0; i < grid.data.length; i++) {
      if (Number.isNaN(grid.data[i])) grid.data[i] = NO_DATA
    }

    const res = grid.resolution
    const toCell = ([x, y]) => [(x - grid.origin[0]) / res, (grid.origin[1] - y) / res]
    const toCoordinate = ({ x, y }) => [
      grid.origin[0] + (x + 0.5) * res,
      grid.origin[1] - (y + 0.5) * res
    ]

    const rings = polygon.getCoordinates().map(ring => ring.map(toCell))
    const { mask: inArea, cells } = rasterizePolygon(rings, grid.width, grid.height)
    if (!cells) {
      showOSD('Observer siting: empty area')
      setTimeout(() => showOSD(''), 3000)
      return
    }

    const center = toLonLat([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2])
    const metersPerCell = res * Math.max(0.087, Math.cos(center[1] * Math.PI / 180))
    const radius = Math.max(2, Math.round(radiusM / metersPerCell))
    const minSpacing = Math.max(2, MIN_SPACING_M / metersPerCell)

    const candidates = findCandidates(grid, inArea, { minSpacing, maxCandidates: MAX_CANDIDATES })
    if (!candidates.length) {
      showOSD('Observer siting: no candidate positions found')
      setTimeout(() => showOSD(''), 3000)
      return
    }

    const viewsheds = []
    for (let i = 0; i < candidates.length; i++) {
      if (cancelled()) return
      if (i % 10 === 0) showOSD(`Observer siting: analysing candidate ${i + 1}/${candidates.length} …`)
      const candidate = candidates[i]
      const result = await engine.compute(grid, {
        ox: candidate.x,
        oy: candidate.y,
        radius,
        metersPerCell,
        observerHeight,
        targetHeight
      })
      if (!result) continue
      const covers = new Uint8Array(grid.width * grid.height)
      for (let y = 0; y < result.h; y++) {
        for (let x = 0; x < result.w; x++) {
          const idx = (result.y0 + y) * grid.width + (result.x0 + x)
          if (inArea[idx] && result.mask[y * result.w + x] === VISIBLE) covers[idx] = 1
        }
      }
      viewsheds.push({ candidate, covers })
    }
    if (cancelled()) return

    const { picks, coverage } = greedySiting({
      areaCells: cells,
      viewsheds,
      targetCoverage: TARGET_COVERAGE,
      maxObservers: MAX_OBSERVERS,
      minGain: MIN_GAIN
    })

    if (!picks.length) {
      showOSD('Observer siting: no viable observer position')
      setTimeout(() => showOSD(''), 3000)
      return
    }

    // One batch insert → a single undo step removes all observers.
    // All observers of a run share a random group tag so they remain
    // recognizable (and filterable via #tag) as covering one area.
    const stamp = militaryFormat.now()
    const groupTag = `OP-${uuid().slice(0, 4)}`
    const tuples = picks.flatMap(({ candidate }, index) => {
      const aosId = ID.aosId()
      return [
        [aosId, {
          type: 'Feature',
          name: `OP ${index + 1}/${picks.length} - ${stamp}`,
          geometry: { type: 'Point', coordinates: toCoordinate(candidate) },
          properties: { radius: radiusM, observerHeight, targetHeight }
        }],
        [ID.tagsId(aosId), [groupTag]]
      ]
    })
    services.store.insert(tuples)

    const summary = `Observer siting: ${picks.length} observer${picks.length > 1 ? 's' : ''} ` +
      `cover ${(coverage * 100).toFixed(0)} % of the area ` +
      `(sensor radius ${formatRadius(radiusM)}, tag #${groupTag})`
    const advice = coverage < TARGET_COVERAGE
      ? ' — increase the sensor radius for better coverage'
      : ''
    showOSD(summary + advice)
    setTimeout(() => { if (!cancelled()) showOSD('') }, 8000)
  }

  const drawHint = () =>
    showOSD(`Observer siting: draw the area (double-click to finish) | sensor radius ${formatRadius(radiusM)} ↑↓`)

  const armedHint = () =>
    showOSD(`Observer siting: sensor radius ${formatRadius(radiusM)} ↑↓ | Enter to compute, Escape to cancel`)

  const start = async () => {
    cancelDraw()
    generation++

    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }

    const defaults = await services.sessionStore.get('tools.aos', {})
    radiusM = Math.min(defaults.radius ?? DEFAULT_RADIUS_M, MAX_RADIUS_M)

    // With a preselected area, wait for radius confirmation instead
    // of computing right away — this is the moment to set the radius.
    const selected = findSelectedArea()
    if (selected?.polygon) {
      pendingPolygon = selected.polygon
      armedHint()
      return
    }
    if (selected?.unsuitable) {
      showOSD('Observer siting: selection is not a closed area — draw one')
      setTimeout(() => { if (drawInteraction) drawHint() }, 2500)
    } else {
      drawHint()
    }
    drawInteraction = new Draw({ type: GeometryType.POLYGON, source: new VectorSource() })
    drawInteraction.once('drawend', ({ feature }) => {
      map.removeInteraction(drawInteraction)
      drawInteraction = null
      run(feature.getGeometry().clone())
    })
    drawInteraction.once('drawabort', () => {
      map.removeInteraction(drawInteraction)
      drawInteraction = null
      showOSD('')
    })
    map.addInteraction(drawInteraction)
  }

  const cancel = () => {
    if (!drawInteraction && !running && !pendingPolygon) return false
    cancelDraw()
    pendingPolygon = null
    generation++
    running = false
    showOSD('')
    return true
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (cancel()) {
        event.preventDefault()
        event.stopPropagation()
      }
      return
    }

    if (event.key === 'Enter' && pendingPolygon) {
      event.preventDefault()
      event.stopPropagation()
      const polygon = pendingPolygon
      pendingPolygon = null
      run(polygon)
      return
    }

    // adjust sensor radius while drawing or while waiting for Enter
    if (!drawInteraction && !pendingPolygon) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    event.stopPropagation()
    const delta = event.key === 'ArrowUp' ? RADIUS_STEP_M : -RADIUS_STEP_M
    radiusM = Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, radiusM + delta))
    if (pendingPolygon) armedHint()
    else drawHint()
  }
  document.addEventListener('keydown', onKeyDown, true)

  services.emitter.on('OBSERVER_SITING', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    start()
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) cancel()
  })
}
