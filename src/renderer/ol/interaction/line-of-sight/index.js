import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { unByKey } from 'ol/Observable'
import uuid from '../../../../shared/uuid'
import * as ID from '../../../ids'
import { ElevationService } from '../../../model/ElevationService'
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
const LOS_DOC_TYPE = 'los'

export default ({ map, services }) => {
  const elevationService = new ElevationService()

  const source = new VectorSource()
  const vector = new VectorLayer({ source, style: null })
  map.addLayer(vector)

  // Features per persisted LoS, keyed by losId.
  // Each entry: { observer, visible, blocked?, blocker?, clip? }
  const featuresByLosId = new Map()

  // In-progress (live-preview) features. Hand-over to featuresByLosId on finalise.
  let visibleSegmentFeature = null
  let blockedSegmentFeature = null
  let observerFeature = null
  let blockerFeature = null
  let clipMarkerFeature = null

  /** @type {'idle' | 'placing-observer' | 'tracking-target'} */
  let mode = 'idle'
  let observer = null
  const observerHeight = DEFAULT_OBSERVER_HEIGHT_M
  const targetHeight = DEFAULT_TARGET_HEIGHT_M
  let computeGeneration = 0
  let clickKey = null
  let moveKey = null

  const setCursor = (value) => {
    const viewport = map.getViewport()
    if (viewport) viewport.style.cursor = value
  }

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  // ────────────────────────────────────────────────────────────
  // In-progress overlay (live preview during placement)
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
    showOSD(`LoS: ${dKm} km${clipInfo} | Δh ${dEye} m${blockerInfo}`)
  }

  const recompute = async (target) => {
    const gen = ++computeGeneration
    const result = await computeLineOfSight({
      observer,
      target,
      observerHeight,
      targetHeight,
      elevationService,
      zoom: map.getView().getZoom()
    })
    if (gen !== computeGeneration) return null
    renderResult(result)
    return result
  }

  // ────────────────────────────────────────────────────────────
  // Persisted LoS rendering (store-driven)
  // ────────────────────────────────────────────────────────────

  const buildFeaturesFromResult = (result) => {
    const { samples, firstBlocker, clipped } = result
    const observerCoord = samples[0].coordinate
    const lastCoord = samples[samples.length - 1].coordinate

    const visibleEndIdx = firstBlocker ? firstBlocker.index : samples.length - 1
    const visibleCoords = samples.slice(0, visibleEndIdx + 1).map(s => s.coordinate)

    const entry = {}

    entry.observer = new Feature(new Point(observerCoord))
    entry.observer.setStyle(observerPointStyle)
    source.addFeature(entry.observer)

    entry.visible = new Feature(new LineString(visibleCoords))
    entry.visible.setStyle(visibleSegmentStyle)
    source.addFeature(entry.visible)

    if (firstBlocker) {
      const blockedCoords = samples.slice(firstBlocker.index).map(s => s.coordinate)
      entry.blocked = new Feature(new LineString(blockedCoords))
      entry.blocked.setStyle(blockedSegmentStyle)
      source.addFeature(entry.blocked)

      entry.blocker = new Feature(new Point(firstBlocker.coordinate))
      entry.blocker.setStyle(blockerPointStyle)
      source.addFeature(entry.blocker)
    }

    if (clipped) {
      entry.clip = new Feature(new Point(lastCoord))
      entry.clip.setStyle(clipMarkerStyle)
      source.addFeature(entry.clip)
    }

    return entry
  }

  const renderPersistedLos = async (losId, doc) => {
    if (featuresByLosId.has(losId)) return
    if (!elevationService.setSource(map)) return
    if (!doc || !doc.observer || !doc.target) return

    const result = await computeLineOfSight({
      observer: doc.observer,
      target: doc.target,
      observerHeight: doc.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M,
      targetHeight: doc.targetHeight ?? DEFAULT_TARGET_HEIGHT_M,
      elevationService,
      zoom: map.getView().getZoom()
    })
    if (!result) return
    // Re-check after await — could have been added by a concurrent path.
    if (featuresByLosId.has(losId)) return

    const entry = buildFeaturesFromResult(result)
    featuresByLosId.set(losId, entry)
  }

  const removePersistedLos = (losId) => {
    const entry = featuresByLosId.get(losId)
    if (!entry) return
    Object.values(entry).forEach(f => source.removeFeature(f))
    featuresByLosId.delete(losId)
  }

  const tryInitialLoad = async () => {
    if (!elevationService.setSource(map)) return false
    const tuples = await services.store.tuples(ID.LOS_SCOPE)
    for (const [id, doc] of tuples) {
      if (!featuresByLosId.has(id)) renderPersistedLos(id, doc)
    }
    return true
  }

  ;(async () => {
    if (await tryInitialLoad()) return
    // Terrain not available yet — retry once a layer is added.
    const key = map.getLayers().on('add', async () => {
      if (await tryInitialLoad()) unByKey(key)
    })
  })()

  services.store.on('batch', ({ operations }) => {
    for (const op of operations) {
      if (!ID.isLosId(op.key)) continue
      if (op.type === 'put') renderPersistedLos(op.key, op.value)
      else if (op.type === 'del') removePersistedLos(op.key)
    }
  })

  // ────────────────────────────────────────────────────────────
  // Tool lifecycle
  // ────────────────────────────────────────────────────────────

  const detachMapListeners = () => {
    if (clickKey) { unByKey(clickKey); clickKey = null }
    if (moveKey) { unByKey(moveKey); moveKey = null }
  }

  const reset = () => {
    detachMapListeners()
    clearInProgressOverlay()
    observer = null
    mode = 'idle'
    setCursor('')
    // Invalidate any in-flight compute so its result will not be rendered.
    computeGeneration++
    showOSD('')
  }

  const finalise = async (coordinate) => {
    const result = await recompute(coordinate)
    if (!result || !observerFeature || !visibleSegmentFeature) {
      clearInProgressOverlay()
      return
    }

    // Hand the in-progress features over as a persistent entry.
    const losId = ID.losId()
    featuresByLosId.set(losId, {
      observer: observerFeature,
      visible: visibleSegmentFeature,
      blocked: blockedSegmentFeature,
      blocker: blockerFeature,
      clip: clipMarkerFeature
    })
    visibleSegmentFeature = null
    blockedSegmentFeature = null
    observerFeature = null
    blockerFeature = null
    clipMarkerFeature = null

    // Persist using the clamped target (so re-render after reload is identical).
    const samples = result.samples
    const persistedTarget = samples[samples.length - 1].coordinate
    const doc = {
      type: LOS_DOC_TYPE,
      observer: result.samples[0].coordinate,
      target: persistedTarget,
      observerHeight,
      targetHeight
    }
    services.store.insert([[losId, doc]])
  }

  const onPointerMove = (event) => {
    if (mode !== 'tracking-target' || !observer) return
    if (event.dragging) return
    recompute(event.coordinate)
  }

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
      await finalise(coordinate)
      observer = null
      showOSD('')
    }
  }

  const start = () => {
    reset()
    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }
    mode = 'placing-observer'
    setCursor('crosshair')
    showOSD('LoS: click to place observer')
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
