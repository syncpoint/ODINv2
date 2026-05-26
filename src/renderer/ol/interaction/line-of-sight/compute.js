import { getLength } from 'ol/sphere'
import LineString from 'ol/geom/LineString'

const EARTH_RADIUS_M = 6371008.8
const REFRACTION_K = 0.13
const EFFECTIVE_RADIUS = EARTH_RADIUS_M / (1 - REFRACTION_K)

export const MAX_DISTANCE_M = 10000
export const DEFAULT_DISTANCE_M = 4000
export const DEFAULT_OBSERVER_HEIGHT_M = 1.7
export const DEFAULT_TARGET_HEIGHT_M = 1.7

const curvatureDrop = d => (d * d) / (2 * EFFECTIVE_RADIUS)

/**
 * Clamp the target coordinate to MAX_DISTANCE_M along the observer→target line.
 * @returns {{coordinate:number[], distance:number, clipped:boolean}}
 */
export const clampToMaxDistance = (observer, target) => {
  const line = new LineString([observer, target])
  const distance = getLength(line)
  if (distance <= MAX_DISTANCE_M) {
    return { coordinate: target, distance, clipped: false }
  }
  const fraction = MAX_DISTANCE_M / distance
  const coordinate = line.getCoordinateAt(fraction)
  return { coordinate, distance: MAX_DISTANCE_M, clipped: true }
}

/**
 * Compute Line-of-Sight from observer to target with earth-curvature
 * and atmospheric-refraction correction.
 *
 * @returns {Promise<null | {
 *   distance:number,
 *   samples:Array<{distance:number, elevation:number|null, coordinate:number[]}>,
 *   observerGroundElev:number, targetGroundElev:number,
 *   observerEyeElev:number,   targetEyeElev:number,
 *   firstBlocker: null | {index:number, distance:number, coordinate:number[], elevation:number},
 *   visible:boolean,
 *   clipped:boolean
 * }>}
 */
export const computeLineOfSight = async ({
  observer, target, observerHeight, targetHeight, elevationService, zoom
}) => {
  const { coordinate: clampedTarget, distance, clipped } = clampToMaxDistance(observer, target)
  if (distance < 1) return null

  const tileGrid = elevationService.tileGrid_
  if (!tileGrid) return null

  const maxZ = tileGrid.getMaxZoom()
  const minZ = tileGrid.getMinZoom()
  const z = Math.max(minZ, Math.min(maxZ, Math.round(zoom)))
  const tileResolutionMeters = tileGrid.getResolution(z)
  const step = Math.max(5, tileResolutionMeters)
  const numSamples = Math.min(800, Math.max(20, Math.ceil(distance / step)))

  const geometry = new LineString([observer, clampedTarget])
  const samples = await elevationService.profileAlongLine(geometry, numSamples, zoom)
  if (samples.length < 2) return null
  if (samples[0].elevation == null || samples[samples.length - 1].elevation == null) return null

  const observerGroundElev = samples[0].elevation
  const targetGroundElev = samples[samples.length - 1].elevation
  const observerEyeElev = observerGroundElev + observerHeight
  const targetEyeElev = targetGroundElev + targetHeight

  const targetCorrected = targetEyeElev - curvatureDrop(distance)
  const losAt = d => observerEyeElev + (targetCorrected - observerEyeElev) * (d / distance)

  let firstBlocker = null
  for (let i = 1; i < samples.length - 1; i++) {
    const s = samples[i]
    if (s.elevation == null) continue
    const corrected = s.elevation - curvatureDrop(s.distance)
    if (corrected > losAt(s.distance)) {
      firstBlocker = { index: i, distance: s.distance, coordinate: s.coordinate, elevation: s.elevation }
      break
    }
  }

  return {
    distance,
    samples,
    observerGroundElev,
    targetGroundElev,
    observerEyeElev,
    targetEyeElev,
    firstBlocker,
    visible: firstBlocker == null,
    clipped
  }
}
