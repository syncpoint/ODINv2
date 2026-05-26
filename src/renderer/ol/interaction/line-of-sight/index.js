import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { unByKey } from 'ol/Observable'
import uuid from '../../../../shared/uuid'
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

export default ({ map, services }) => {
  const elevationService = new ElevationService()

  const source = new VectorSource()
  const vector = new VectorLayer({ source, style: null })
  map.addLayer(vector)

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

  let visibleSegmentFeature = null
  let blockedSegmentFeature = null
  let observerFeature = null
  let blockerFeature = null
  let clipMarkerFeature = null

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  /**
   * Remove only the in-progress features (those held by the current slot).
   * Previously finalised LoS features stay on the map.
   */
  const clearOverlay = () => {
    if (visibleSegmentFeature) source.removeFeature(visibleSegmentFeature)
    if (blockedSegmentFeature) source.removeFeature(blockedSegmentFeature)
    if (observerFeature) source.removeFeature(observerFeature)
    if (blockerFeature) source.removeFeature(blockerFeature)
    if (clipMarkerFeature) source.removeFeature(clipMarkerFeature)
    visibleSegmentFeature = null
    blockedSegmentFeature = null
    observerFeature = null
    blockerFeature = null
    clipMarkerFeature = null
  }

  /**
   * Detach the current feature handles without removing features from the source.
   * The features then become a frozen, persistent LoS on the map.
   */
  const detachCurrentFeatures = () => {
    visibleSegmentFeature = null
    blockedSegmentFeature = null
    observerFeature = null
    blockerFeature = null
    clipMarkerFeature = null
  }

  const detachMapListeners = () => {
    if (clickKey) { unByKey(clickKey); clickKey = null }
    if (moveKey) { unByKey(moveKey); moveKey = null }
  }

  const reset = () => {
    detachMapListeners()
    clearOverlay()
    observer = null
    mode = 'idle'
    setCursor('')
    // Invalidate any in-flight compute so its result will not be rendered.
    computeGeneration++
    showOSD('')
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

  const removeFeatureIfPresent = (feature) => {
    if (feature) source.removeFeature(feature)
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
    if (gen !== computeGeneration) return
    renderResult(result)
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
      // Finalise: run one last compute with the click coordinate, then
      // release the current feature handles so the result stays on the map.
      await recompute(coordinate)
      detachCurrentFeatures()
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
