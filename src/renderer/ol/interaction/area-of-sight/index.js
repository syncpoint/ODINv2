import { Image as ImageLayer } from 'ol/layer'
import ImageCanvas from 'ol/source/ImageCanvas'
import { Select } from 'ol/interaction'
import { unByKey } from 'ol/Observable'
import { toLonLat } from 'ol/proj'
import { containsExtent } from 'ol/extent'
import uuid from '../../../../shared/uuid'
import { militaryFormat } from '../../../../shared/datetime'
import * as ID from '../../../ids'
import { ElevationService, onTerrainReady } from '../../../model/ElevationService'
import { ViewshedEngine, VISIBLE, HIDDEN, NO_DATA } from './engine'

const ORIGINATOR_ID = uuid()

export const DEFAULT_RADIUS_M = 2500
export const MAX_RADIUS_M = 10000
const DEFAULT_OBSERVER_HEIGHT_M = 2
const DEFAULT_TARGET_HEIGHT_M = 2

const VISIBLE_RGBA = [40, 170, 60, 100]
const HIDDEN_RGBA = [200, 40, 40, 100]

/**
 * Area-of-Sight tool. Persisted AoS documents are plain GeoJSON features
 * (Point observer + radius/height properties) whose vector representation
 * (observer point, radius rim) is rendered by the standard feature
 * pipeline (style: ol/style/aos.js). This module handles:
 *   - the placement tool with its live raster preview
 *   - computing and compositing the visibility rasters (store-driven)
 *   - hide/show state for the rasters (mirroring visibilityTracker)
 *   - migrating pre-pipeline documents to GeoJSON
 */
export default ({ map, services }) => {
  const elevationService = new ElevationService()
  const engine = new ViewshedEngine()

  // ────────────────────────────────────────────────────────────
  // Raster overlay: one ImageCanvas source composites the live
  // preview and all persisted viewsheds into the current view.
  // ────────────────────────────────────────────────────────────

  // aosId -> { doc, canvas, extent }
  const entries = new Map()
  const hiddenIds = new Set()
  let preview = null // { canvas, extent }

  const composite = document.createElement('canvas')

  const canvasFunction = (extent, resolution, pixelRatio, size) => {
    composite.width = size[0]
    composite.height = size[1]
    const ctx = composite.getContext('2d')
    const scale = pixelRatio / resolution
    const draw = entry => {
      if (!entry) return
      const [minX, minY, maxX, maxY] = entry.extent
      ctx.drawImage(
        entry.canvas,
        (minX - extent[0]) * scale,
        (extent[3] - maxY) * scale,
        (maxX - minX) * scale,
        (maxY - minY) * scale
      )
    }
    entries.forEach((entry, id) => { if (!hiddenIds.has(id)) draw(entry) })
    draw(preview)
    return composite
  }

  const rasterSource = new ImageCanvas({ canvasFunction, ratio: 1 })
  map.addLayer(new ImageLayer({ source: rasterSource }))

  /**
   * Render a mask window into a colorized canvas, clipped to the
   * circular radius around the observer.
   */
  const colorize = (result, observerCell, radius) => {
    const { mask, x0, y0, w, h } = result
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(w, h)
    const data = image.data
    const cx = observerCell[0] - x0
    const cy = observerCell[1] - y0
    const r2 = radius * radius
    for (let y = 0; y < h; y++) {
      const dy = y - cy
      for (let x = 0; x < w; x++) {
        const dx = x - cx
        if (dx * dx + dy * dy > r2) continue
        const value = mask[y * w + x]
        if (value !== VISIBLE && value !== HIDDEN) continue
        const rgba = value === VISIBLE ? VISIBLE_RGBA : HIDDEN_RGBA
        const o = (y * w + x) * 4
        data[o] = rgba[0]; data[o + 1] = rgba[1]; data[o + 2] = rgba[2]; data[o + 3] = rgba[3]
      }
    }
    ctx.putImageData(image, 0, 0)
    return canvas
  }

  const windowExtent = (grid, { x0, y0, w, h }) => {
    const [gx, gy] = grid.origin
    const res = grid.resolution
    return [gx + x0 * res, gy - (y0 + h) * res, gx + (x0 + w) * res, gy - y0 * res]
  }

  // ────────────────────────────────────────────────────────────
  // Grid management
  // ────────────────────────────────────────────────────────────

  let grid = null
  let gridExtent = null

  const sanitize = data => {
    for (let i = 0; i < data.length; i++) if (Number.isNaN(data[i])) data[i] = NO_DATA
  }

  // Radius in projection units: Web Mercator inflates ground distances
  // by 1/cos(lat).
  const projectedRadius = (coordinate, radiusM) => {
    const lat = toLonLat(coordinate)[1] * Math.PI / 180
    return radiusM / Math.max(0.087, Math.cos(lat)) // clamp beyond ±85°
  }

  const requiredExtent = (coordinate, radiusM) => {
    const r = projectedRadius(coordinate, radiusM) * 1.05
    return [coordinate[0] - r, coordinate[1] - r, coordinate[0] + r, coordinate[1] + r]
  }

  const ensureGrid = async (coordinate, radiusM) => {
    const required = requiredExtent(coordinate, radiusM)
    if (grid && containsExtent(gridExtent, required)) return grid
    const fetched = await elevationService.getGrid(required)
    if (!fetched) return null
    sanitize(fetched.data)
    grid = fetched
    gridExtent = [
      grid.origin[0],
      grid.origin[1] - grid.height * grid.resolution,
      grid.origin[0] + grid.width * grid.resolution,
      grid.origin[1]
    ]
    return grid
  }

  /**
   * Compute viewshed for observer coordinate + doc properties.
   */
  const computeViewshed = async (coordinate, properties) => {
    const radiusM = Math.min(properties.radius ?? DEFAULT_RADIUS_M, MAX_RADIUS_M)
    const g = await ensureGrid(coordinate, radiusM)
    if (!g) return null

    const res = g.resolution
    const ox = Math.floor((coordinate[0] - g.origin[0]) / res)
    const oy = Math.floor((g.origin[1] - coordinate[1]) / res)
    const lat = toLonLat(coordinate)[1] * Math.PI / 180
    const metersPerCell = res * Math.max(0.087, Math.cos(lat))
    const radius = Math.max(2, Math.round(radiusM / metersPerCell))

    const result = await engine.compute(g, {
      ox,
      oy,
      radius,
      metersPerCell,
      observerHeight: properties.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M,
      targetHeight: properties.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
    })
    if (!result) return null

    return {
      canvas: colorize(result, [ox, oy], radius),
      extent: windowExtent(g, result)
    }
  }

  // ────────────────────────────────────────────────────────────
  // Persisted AoS rendering (store-driven)
  // ────────────────────────────────────────────────────────────

  const observerOf = doc => doc?.geometry?.type === 'Point' ? doc.geometry.coordinates : null

  const sameCoord = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

  // Only analysis-relevant parts trigger a recompute (rename does not).
  const docChanged = (a, b) =>
    !a || !b ||
    a.properties?.radius !== b.properties?.radius ||
    a.properties?.observerHeight !== b.properties?.observerHeight ||
    a.properties?.targetHeight !== b.properties?.targetHeight ||
    !sameCoord(observerOf(a), observerOf(b))

  const removePersistedAos = (aosId) => {
    if (!entries.delete(aosId)) return
    rasterSource.changed()
  }

  const renderPersistedAos = async (aosId, doc) => {
    const observer = observerOf(doc)
    if (!observer) return
    if (!elevationService.setSource(map)) return

    const rendered = await computeViewshed(observer, doc.properties ?? {})
    if (!rendered) return
    entries.set(aosId, { doc, ...rendered })
    rasterSource.changed()
  }

  const loadPersistedDocs = async () => {
    const tuples = await services.store.tuples(ID.AOS_SCOPE)
    for (const [id, doc] of tuples) {
      const existing = entries.get(id)
      if (!existing || docChanged(existing.doc, doc)) renderPersistedAos(id, doc)
    }
  }

  ;(async () => {
    // Migration: pre-pipeline docs {observer, radius, heights} → GeoJSON
    const tuples = await services.store.tuples(ID.AOS_SCOPE)
    const legacy = tuples.filter(([, doc]) => doc && !doc.geometry && doc.observer)
    if (legacy.length) {
      services.store.insert(legacy.map(([id, doc]) => [id, {
        type: 'Feature',
        name: `AoS - ${militaryFormat.now()}`,
        geometry: { type: 'Point', coordinates: doc.observer },
        properties: {
          radius: doc.radius ?? DEFAULT_RADIUS_M,
          observerHeight: doc.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M,
          targetHeight: doc.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
        }
      }]))
    }

    // Initial hidden state (mirrors visibilityTracker).
    const hiddenKeys = await services.store.keys(ID.hiddenId())
    hiddenKeys
      .map(ID.associatedId)
      .filter(ID.isAosId)
      .forEach(id => hiddenIds.add(id))

    onTerrainReady(map, () => {
      if (!elevationService.setSource(map)) return false
      loadPersistedDocs()
      return true
    })
  })()

  services.store.on('batch', ({ operations }) => {
    for (const op of operations) {
      // hide/show tombstones for aos ids
      if (ID.isHiddenId(op.key)) {
        const id = ID.associatedId(op.key)
        if (!ID.isAosId(id)) continue
        if (op.type === 'put') hiddenIds.add(id)
        else hiddenIds.delete(id)
        rasterSource.changed()
        continue
      }

      if (!ID.isAosId(op.key)) continue
      if (op.type === 'del') {
        removePersistedAos(op.key)
        continue
      }
      const existing = entries.get(op.key)
      if (existing && !docChanged(existing.doc, op.value)) {
        existing.doc = op.value // keep rename etc. without recompute
        continue
      }
      renderPersistedAos(op.key, op.value)
    }
  })

  // Temporary reveal of hidden features while highlighted in search.
  const onTemporaryVisibility = hide => ({ ids }) => {
    const relevant = ids.map(ID.associatedId).filter(ID.isAosId)
    if (!relevant.length) return
    relevant.forEach(id => hide ? hiddenIds.add(id) : hiddenIds.delete(id))
    rasterSource.changed()
  }
  services.emitter.on('feature/show', onTemporaryVisibility(false))
  services.emitter.on('feature/hide', onTemporaryVisibility(true))

  // ────────────────────────────────────────────────────────────
  // Tool lifecycle: viewshed follows the cursor, click to fix
  // ────────────────────────────────────────────────────────────

  /** @type {'idle' | 'tracking'} */
  let mode = 'idle'
  let clickKey = null
  let moveKey = null
  let busy = false
  let pending = null
  let generation = 0
  let lastCoordinate = null

  const RADIUS_STEP_M = 250
  const MIN_RADIUS_M = 250

  const liveProperties = {
    radius: DEFAULT_RADIUS_M,
    observerHeight: DEFAULT_OBSERVER_HEIGHT_M,
    targetHeight: DEFAULT_TARGET_HEIGHT_M
  }

  const setCursor = value => {
    const viewport = map.getViewport()
    if (viewport) viewport.style.cursor = value
  }

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  const settingsInfo = () => {
    const km = liveProperties.radius >= 1000
      ? `${(liveProperties.radius / 1000).toFixed(2)} km`
      : `${liveProperties.radius} m`
    return `Radius ${km} ↑↓ | Obs ${liveProperties.observerHeight.toFixed(1)} m ⇧↑↓ | ` +
      `Tgt ${liveProperties.targetHeight.toFixed(1)} m ⌥↑↓`
  }

  const selectInteraction = () =>
    map.getInteractions().getArray().find(i => i instanceof Select)

  const setSelectActive = active => {
    const select = selectInteraction()
    if (select) select.setActive(active)
  }

  const clearPreview = () => {
    preview = null
    rasterSource.changed()
  }

  const showPreview = async (coordinate) => {
    const gen = generation
    const rendered = await computeViewshed(coordinate, liveProperties)
    if (gen !== generation) return
    preview = rendered
    rasterSource.changed()
  }

  const track = async (coordinate) => {
    if (busy) {
      pending = coordinate
      return
    }
    busy = true
    try {
      await showPreview(coordinate)
      while (pending) {
        const next = pending
        pending = null
        await showPreview(next)
      }
    } finally {
      busy = false
    }
  }

  const detachMapListeners = () => {
    if (clickKey) { unByKey(clickKey); clickKey = null }
    if (moveKey) { unByKey(moveKey); moveKey = null }
  }

  const reset = () => {
    detachMapListeners()
    clearPreview()
    mode = 'idle'
    pending = null
    lastCoordinate = null
    generation++
    setCursor('')
    setSelectActive(true)
    showOSD('')
  }

  const finalise = (coordinate) => {
    const doc = {
      type: 'Feature',
      name: `AoS - ${militaryFormat.now()}`,
      geometry: { type: 'Point', coordinates: coordinate },
      properties: { ...liveProperties }
    }
    services.store.insert([[ID.aosId(), doc]])
    services.sessionStore.put('tools.aos', { ...liveProperties })
  }

  const onPointerMove = (event) => {
    if (mode !== 'tracking' || event.dragging) return
    lastCoordinate = event.coordinate
    track(event.coordinate)
  }

  // Radius/height adjustment and cancel while the tool is active.
  // Capture phase so map keyboard handlers do not interfere.
  const onKeyDown = (event) => {
    if (mode !== 'tracking') return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      reset()
      return
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    event.stopPropagation()
    const up = event.key === 'ArrowUp'
    if (event.shiftKey) {
      liveProperties.observerHeight = Math.max(0, liveProperties.observerHeight + (up ? 0.5 : -0.5))
    } else if (event.altKey) {
      liveProperties.targetHeight = Math.max(0, liveProperties.targetHeight + (up ? 0.5 : -0.5))
    } else {
      liveProperties.radius = Math.min(MAX_RADIUS_M,
        Math.max(MIN_RADIUS_M, liveProperties.radius + (up ? RADIUS_STEP_M : -RADIUS_STEP_M)))
    }
    showOSD(`AoS: ${settingsInfo()} | click to place`)
    if (lastCoordinate) track(lastCoordinate)
  }
  document.addEventListener('keydown', onKeyDown, true)

  const onSingleClick = (event) => {
    if (mode !== 'tracking') return
    mode = 'idle'
    detachMapListeners()
    setCursor('')
    setSelectActive(true)
    generation++
    clearPreview()
    showOSD('')
    finalise(event.coordinate)
  }

  const start = async () => {
    reset()
    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }
    engine.init().then(backend => {
      if (backend === 'cpu') console.warn('[AoS] WebGPU unavailable — CPU fallback active')
    })
    // last-used settings are the defaults for the next placement
    const defaults = await services.sessionStore.get('tools.aos', {})
    liveProperties.radius = defaults.radius ?? DEFAULT_RADIUS_M
    liveProperties.observerHeight = defaults.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M
    liveProperties.targetHeight = defaults.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
    mode = 'tracking'
    setCursor('crosshair')
    setSelectActive(false)
    showOSD(`AoS: ${settingsInfo()} | click to place`)
    clickKey = map.on('singleclick', onSingleClick)
    moveKey = map.on('pointermove', onPointerMove)
  }

  services.emitter.on('AREA_OF_SIGHT', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    start()
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) reset()
  })
}
