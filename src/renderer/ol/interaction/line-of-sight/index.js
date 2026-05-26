import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Select } from 'ol/interaction'
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
  vector.set('selectable', true)
  map.addLayer(vector)

  // Per persisted LoS, keyed by losId. Each entry:
  //   { doc, features: { observer, visible, blocked?, blocker?, clip? } }
  // `doc` is the last value used to render so we can detect actual changes
  // (heights, observer, target) on store batch put operations.
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

  const buildFeaturesFromResult = (losId, result) => {
    const { samples, firstBlocker, clipped } = result
    const observerCoord = samples[0].coordinate
    const lastCoord = samples[samples.length - 1].coordinate

    const visibleEndIdx = firstBlocker ? firstBlocker.index : samples.length - 1
    const visibleCoords = samples.slice(0, visibleEndIdx + 1).map(s => s.coordinate)

    const features = {}

    features.observer = new Feature(new Point(observerCoord))
    features.observer.setStyle(observerPointStyle)
    features.observer.setId(losId)
    source.addFeature(features.observer)

    features.visible = new Feature(new LineString(visibleCoords))
    features.visible.setStyle(visibleSegmentStyle)
    features.visible.setId(losId)
    source.addFeature(features.visible)

    if (firstBlocker) {
      const blockedCoords = samples.slice(firstBlocker.index).map(s => s.coordinate)
      features.blocked = new Feature(new LineString(blockedCoords))
      features.blocked.setStyle(blockedSegmentStyle)
      features.blocked.setId(losId)
      source.addFeature(features.blocked)

      features.blocker = new Feature(new Point(firstBlocker.coordinate))
      features.blocker.setStyle(blockerPointStyle)
      features.blocker.setId(losId)
      source.addFeature(features.blocker)
    }

    if (clipped) {
      features.clip = new Feature(new Point(lastCoord))
      features.clip.setStyle(clipMarkerStyle)
      features.clip.setId(losId)
      source.addFeature(features.clip)
    }

    return features
  }

  const sameCoord = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

  const docChanged = (a, b) =>
    !a || !b ||
    a.observerHeight !== b.observerHeight ||
    a.targetHeight !== b.targetHeight ||
    !sameCoord(a.observer, b.observer) ||
    !sameCoord(a.target, b.target)

  const renderPersistedLos = async (losId, doc) => {
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
    // A concurrent path may have rendered it while we awaited; if so,
    // drop the existing features so we win and stay consistent with `doc`.
    if (featuresByLosId.has(losId)) removePersistedLos(losId)

    const features = buildFeaturesFromResult(losId, result)
    featuresByLosId.set(losId, { doc, features })
  }

  const removePersistedLos = (losId) => {
    const entry = featuresByLosId.get(losId)
    if (!entry) return
    Object.values(entry.features).forEach(f => f && source.removeFeature(f))
    featuresByLosId.delete(losId)
  }

  const tryInitialLoad = async () => {
    if (!elevationService.setSource(map)) return false
    const tuples = await services.store.tuples(ID.LOS_SCOPE)
    for (const [id, doc] of tuples) {
      const existing = featuresByLosId.get(id)
      if (!existing || docChanged(existing.doc, doc)) renderPersistedLos(id, doc)
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
      if (op.type === 'del') {
        removePersistedLos(op.key)
        continue
      }
      // put: skip when the stored doc matches what we already rendered
      // (e.g. our own self-echo right after finalise).
      const existing = featuresByLosId.get(op.key)
      if (existing && !docChanged(existing.doc, op.value)) continue
      renderPersistedLos(op.key, op.value)
    }
  })

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
    detachMapListeners()
    clearInProgressOverlay()
    observer = null
    mode = 'idle'
    setCursor('')
    setSelectActive(true)
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

    // Hand the in-progress features over as a persistent entry; assigning
    // the losId lets the select-interaction map clicks on any sub-feature
    // back to the same document.
    const losId = ID.losId()
    const features = {
      observer: observerFeature,
      visible: visibleSegmentFeature,
      blocked: blockedSegmentFeature,
      blocker: blockerFeature,
      clip: clipMarkerFeature
    }
    Object.values(features).forEach(f => f && f.setId(losId))

    // Persist using the clamped target (so re-render after reload is identical).
    const persistedTarget = result.samples[result.samples.length - 1].coordinate
    const doc = {
      type: LOS_DOC_TYPE,
      observer: result.samples[0].coordinate,
      target: persistedTarget,
      observerHeight,
      targetHeight
    }
    featuresByLosId.set(losId, { doc, features })

    visibleSegmentFeature = null
    blockedSegmentFeature = null
    observerFeature = null
    blockerFeature = null
    clipMarkerFeature = null

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
      setSelectActive(true)
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
    setSelectActive(false)
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
