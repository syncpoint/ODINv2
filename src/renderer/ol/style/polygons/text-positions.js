import * as R from 'ramda'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import * as math from 'mathjs'

/**
 * segmentIntersect :: ([x, y], [x, y]) -> [[x0, y0], [x1, y1]] -> [x, y]
 * Intersection point of two line segments yz and segment.
 */
const segmentIntersect = (y, z) => segment => {
  const intersection = math.intersect(segment[0], segment[1], y, z)
  if (!intersection) return []
  const extent = new geom.LineString(segment).getExtent()
  if (!containsXY(extent, intersection[0], intersection[1])) return []
  return [intersection]
}


/**
 * axisIntersect :: ([[x, y]], [x, y], [x, y]) -> [[x, y]] -> [[x, y]]
 * Maximum of two intersection points of line segment yz
 * with all segments formed by points.
 */
const axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])

export const textPositions = geometry => {
  const ring = geometry.getLinearRing(0)
  const box = ring.getExtent()
  const coords = ring.getCoordinates()
  const center = geometry.getInteriorPoint().getCoordinates() // XYM layout
  const points = {}

  // TODO: c839daed-08ba-4f2c-9257-d4790dec037f - polygon labels: lazy evaluation/cache declarative positions

  const topRightLeft = () => {
    const y = box[1] + (box[3] - box[1]) * 0.95
    const xs = axisIntersect(coords, [box[0], y], [box[2], y])
    if (xs.length === 2) {
      points.topRight = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
      points.topLeft = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    } else {
      delete points.topRight
      delete points.topLeft
    }
  }

  const hIntersect = () => {
    const xs = axisIntersect(coords, [box[0], center[1]], [box[2], center[1]])
    if (xs.length === 2) {
      points.right = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
      points.left = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    } else {
      delete points.right
      delete points.left
    }
  }

  const vIntersect = () => {
    const xs = axisIntersect(coords, [center[0], box[1]], [center[0], box[3]])
    if (xs.length === 2) {
      points.bottom = () => new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0])
      points.top = () => new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
    } else {
      delete points.bottom
      delete points.top
    }
  }

  points.center = () => geometry.getInteriorPoint()
  points.footer = () => new geom.Point([center[0], box[1]])
  points.topRight = () => { topRightLeft(); return points.topRight() }
  points.topLeft = () => { topRightLeft(); return points.topLeft() }
  points.right = () => { hIntersect(); return points.right() }
  points.left = () => { hIntersect(); return points.left() }
  points.bottom = () => { vIntersect(); return points.bottom() }
  points.top = () => { vIntersect(); return points.top() }

  return points
}
