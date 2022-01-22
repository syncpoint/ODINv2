import * as C from 'ol/coordinate'

/**
 *
 */
export const Coordinate = {
  distance:
    xs => xs.every(x => x !== null)
      ? C.distance(...xs)
      : Infinity,

  squaredDistance:
    xs => xs.every(x => x !== null)
      ? C.squaredDistance(...xs)
      : Infinity,

  squaredDistanceToSegment:
    coordinate => segment =>
      C.squaredDistanceToSegment(coordinate, segment),

  closestOnSegment:
    coordinate => segment =>
      C.closestOnSegment(coordinate, segment)
}
