import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Select } from 'ol/interaction'
import { unByKey } from 'ol/Observable'
import uuid from '../../../../shared/uuid'
import { militaryFormat } from '../../../../shared/datetime'
import * as ID from '../../../ids'
import { ElevationService, onTerrainReady } from '../../../model/ElevationService'
import { setComputer } from '../../style/losCompute'
import {
  computeLineOfSight,
  DEFAULT_OBSERVER_HEIGHT_M,
  DEFAULT_TARGET_HEIGHT_M
} from './compute'
import {
  visibleSegmentStyle,
  blockedSegmentStyle,
  observerPointStyle,
  blockerPointStyle,
  clipMarkerStyle
} from './style'

const ORIGINATOR_ID = uuid()

/**
 * Line-of-Sight tool. Persisted LoS documents are plain GeoJSON features
 * (LineString observer→target) rendered by the standard feature pipeline
 * (style: ol/style/los.js) — this module only handles:
 *   - the placement tool with its live preview overlay
 *   - registering the profile computer once terrain is available
 *   - migrating pre-pipeline documents to GeoJSON
 */
export default ({ map, services }) => {
  const elevationService = new ElevationService()

  // In-progress (live-preview) overlay during placement.
  const source = new VectorSource()
  const vector = new VectorLayer({ source, style: null })
  map.addLayer(vector)

  let visibleSegmentFeature = null
  let blockedSegmentFeature = null
  let observerFeature = null
  let blockerFeature = null
  let clipMarkerFeature = null

  /** @type {'idle' | 'placing-observer' | 'tracking-target'} */
  let mode = 'idle'
  let observer = null
  let observerHeight = DEFAULT_OBSERVER_HEIGHT_M
  let targetHeight = DEFAULT_TARGET_HEIGHT_M
  let lastTarget = null
  let computeGeneration = 0
  let clickKey = null
  let moveKey = null

  const setCursor = (value) => {
    const viewport = map.getViewport()
    if (viewport) viewport.style.cursor = value
  }

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  const heightsInfo = () =>
    `Obs ${observerHeight.toFixed(1)} m ↑↓ | Tgt ${targetHeight.toFixed(1)} m ⇧↑↓`

  // ────────────────────────────────────────────────────────────
  // Terrain discovery: the los style computes through this bridge.
  // ────────────────────────────────────────────────────────────

  const tryEnableComputer = () => {
    if (!elevationService.setSource(map)) return false
    setComputer(params => computeLineOfSight({ ...params, elevationService }))
    return true
  }

  onTerrainReady(map, tryEnableComputer);

  // ────────────────────────────────────────────────────────────
  // Migration: pre-pipeline docs {observer, target, heights} → GeoJSON
  // ────────────────────────────────────────────────────────────

  (async () => {
    const tuples = await services.store.tuples(ID.LOS_SCOPE)
    const legacy = tuples.filter(([, doc]) => doc && !doc.geometry && doc.observer && doc.target)
    if (!legacy.length) return
    services.store.insert(legacy.map(([id, doc]) => [id, {
      type: 'Feature',
      name: `LoS - ${militaryFormat.now()}`,
      geometry: { type: 'LineString', coordinates: [doc.observer, doc.target] },
      properties: {
        observerHeight: doc.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M,
        targetHeight: doc.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
      }
    }]))
  })()

  // ────────────────────────────────────────────────────────────
  // Live preview overlay
  // ────────────────────────────────────────────────────────────

  const removeFeatureIfPresent = (feature) => {
    if (feature) source.removeFeature(feature)
  }

  const clearInProgressOverlay = () => {
    removeFeatureIfPresent(visibleSegmentFeature); visibleSegmentFeature = null
    removeFeatureIfPresent(blockedSegmentFeature); blockedSegmentFeature = null
    removeFeatureIfPresent(observerFeature); observerFeature = null
    removeFeatureIfPresent(blockerFeature); blockerFeature = null
    removeFeatureIfPresent(clipMarkerFeature); clipMarkerFeature = null
  }

  const setObserverFeature = (coord) => {
    if (!observerFeature) {
      observerFeature = new Feature(new Point(coord))
      observerFeature.setStyle(observerPointStyle)
      source.addFeature(observerFeature)
    } else {
      observerFeature.getGeometry().setCoordinates(coord)
    }
  }

  const renderResult = (result) => {
    if (!result) {
      removeFeatureIfPresent(visibleSegmentFeature); visibleSegmentFeature = null
      removeFeatureIfPresent(blockedSegmentFeature); blockedSegmentFeature = null
      removeFeatureIfPresent(blockerFeature); blockerFeature = null
      removeFeatureIfPresent(clipMarkerFeature); clipMarkerFeature = null
      return
    }

    const { samples, firstBlocker, clipped } = result
    const lastCoord = samples[samples.length - 1].coordinate

    const visibleEndIdx = firstBlocker ? firstBlocker.index : samples.length - 1
    const visibleCoords = samples.slice(0, visibleEndIdx + 1).map(s => s.coordinate)
    if (!visibleSegmentFeature) {
      visibleSegmentFeature = new Feature(new LineString(visibleCoords))
      visibleSegmentFeature.setStyle(visibleSegmentStyle)
      source.addFeature(visibleSegmentFeature)
    } else {
      visibleSegmentFeature.getGeometry().setCoordinates(visibleCoords)
    }

    if (firstBlocker) {
      const blockedCoords = samples.slice(firstBlocker.index).map(s => s.coordinate)
      if (!blockedSegmentFeature) {
        blockedSegmentFeature = new Feature(new LineString(blockedCoords))
        blockedSegmentFeature.setStyle(blockedSegmentStyle)
        source.addFeature(blockedSegmentFeature)
      } else {
        blockedSegmentFeature.getGeometry().setCoordinates(blockedCoords)
      }
      if (!blockerFeature) {
        blockerFeature = new Feature(new Point(firstBlocker.coordinate))
        blockerFeature.setStyle(blockerPointStyle)
        source.addFeature(blockerFeature)
      } else {
        blockerFeature.getGeometry().setCoordinates(firstBlocker.coordinate)
      }
    } else {
      removeFeatureIfPresent(blockedSegmentFeature); blockedSegmentFeature = null
      removeFeatureIfPresent(blockerFeature); blockerFeature = null
    }

    if (clipped) {
      if (!clipMarkerFeature) {
        clipMarkerFeature = new Feature(new Point(lastCoord))
        clipMarkerFeature.setStyle(clipMarkerStyle)
        source.addFeature(clipMarkerFeature)
      } else {
        clipMarkerFeature.getGeometry().setCoordinates(lastCoord)
      }
    } else {
      removeFeatureIfPresent(clipMarkerFeature); clipMarkerFeature = null
    }

    const dKm = (result.distance / 1000).toFixed(2)
    const dEye = Math.round(result.targetEyeElev - result.observerEyeElev)
    const blockerInfo = firstBlocker
      ? ` | blocked at ${(firstBlocker.distance / 1000).toFixed(2)} km`
      : ' | clear'
    const clipInfo = result.clipped ? ' (max 10 km)' : ''
    showOSD(`LoS: ${dKm} km${clipInfo} | Δh ${dEye} m${blockerInfo} | ${heightsInfo()}`)
  }

  const recompute = async (target) => {
    const gen = ++computeGeneration
    const result = await computeLineOfSight({
      observer,
      target,
      observerHeight,
      targetHeight,
      elevationService
    })
    if (gen !== computeGeneration) return null
    renderResult(result)
    return result
  }

  // ────────────────────────────────────────────────────────────
  // Tool lifecycle
  // ────────────────────────────────────────────────────────────

  const detachMapListeners = () => {
    if (clickKey) { unByKey(clickKey); clickKey = null }
    if (moveKey) { unByKey(moveKey); moveKey = null }
  }

  // The map's Select interaction reacts to the same singleclick events we
  // use for placing the observer/target. Deactivate it while the LoS tool
  // is live so a click does not also select the LoS that was just drawn.
  const selectInteraction = () =>
    map.getInteractions().getArray().find(i => i instanceof Select)

  const setSelectActive = (active) => {
    const select = selectInteraction()
    if (select) select.setActive(active)
  }

  const reset = () => {
    // The emitter dispatches asynchronously: an unconditional OSD clear
    // from an idle tool would erase the hint another tool just showed.
    const wasActive = mode !== 'idle'
    detachMapListeners()
    clearInProgressOverlay()
    observer = null
    lastTarget = null
    mode = 'idle'
    setCursor('')
    setSelectActive(true)
    // Invalidate any in-flight compute so its result will not be rendered.
    computeGeneration++
    if (wasActive) showOSD('')
  }

  const finalise = async (coordinate) => {
    const result = await recompute(coordinate)
    clearInProgressOverlay()
    if (!result) return

    // Persist observer→clamped target; the feature pipeline renders it.
    const doc = {
      type: 'Feature',
      name: `LoS - ${militaryFormat.now()}`,
      geometry: {
        type: 'LineString',
        coordinates: [
          result.samples[0].coordinate,
          result.samples[result.samples.length - 1].coordinate
        ]
      },
      properties: { observerHeight, targetHeight }
    }
    services.store.insert([[ID.losId(), doc]])
    services.sessionStore.put('tools.los', { observerHeight, targetHeight })
  }

  const onPointerMove = (event) => {
    if (event.dragging) return
    if (mode === 'placing-observer') {
      // re-assert the hint — a lost race with another tool's OSD clear
      // right after start() would otherwise leave the cell empty
      showOSD(`LoS: click to place observer | ${heightsInfo()}`)
    } else if (mode === 'tracking-target' && observer) {
      lastTarget = event.coordinate
      recompute(event.coordinate)
    }
  }

  // Height adjustment and cancel while the tool is active. Capture phase
  // so map keyboard handlers (Escape deselect, pan) do not interfere.
  const onKeyDown = (event) => {
    if (mode === 'idle') return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      reset()
      return
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    event.stopPropagation()
    const delta = event.key === 'ArrowUp' ? 0.5 : -0.5
    if (event.shiftKey) targetHeight = Math.max(0, targetHeight + delta)
    else observerHeight = Math.max(0, observerHeight + delta)
    if (mode === 'tracking-target' && lastTarget) recompute(lastTarget)
    else showOSD(`LoS: click to place observer | ${heightsInfo()}`)
  }
  document.addEventListener('keydown', onKeyDown, true)

  const onSingleClick = async (event) => {
    if (mode === 'placing-observer') {
      observer = event.coordinate
      setObserverFeature(observer)
      mode = 'tracking-target'
      showOSD('LoS: move cursor to choose target, click to fix')
    } else if (mode === 'tracking-target') {
      const coordinate = event.coordinate
      mode = 'idle'
      setCursor('')
      detachMapListeners()
      setSelectActive(true)
      await finalise(coordinate)
      observer = null
      showOSD('')
    }
  }

  const start = async () => {
    reset()
    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }
    // last-used heights are the defaults for the next placement
    const defaults = await services.sessionStore.get('tools.los', {})
    observerHeight = defaults.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M
    targetHeight = defaults.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
    mode = 'placing-observer'
    setCursor('crosshair')
    setSelectActive(false)
    showOSD(`LoS: click to place observer | ${heightsInfo()}`)
    clickKey = map.on('singleclick', onSingleClick)
    moveKey = map.on('pointermove', onPointerMove)
  }

  services.emitter.on('LINE_OF_SIGHT', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    start()
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) reset()
  })
}
