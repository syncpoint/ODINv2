import * as R from 'ramda'
import { altKeyOnly } from 'ol/events/condition'
import {
  squaredDistanceToSegment,
  closestOnSegment,
  distance,
  squaredDistance
} from 'ol/coordinate'

/**
 *
 */
const Coordinate = {
  distance:
    xs => xs.every(x => x !== null)
      ? distance(...xs)
      : Infinity,

  squaredDistance:
    xs => xs.every(x => x !== null)
      ? squaredDistance(...xs)
      : Infinity,

  squaredDistanceToSegment:
    coordinate => segment =>
      squaredDistanceToSegment(coordinate, segment),

  closestOnSegment:
    coordinate => segment =>
      closestOnSegment(coordinate, segment)
}



/**
 *
 */
export const message = (options, event) => {
  const map = event.map
  const view = map.getView()
  const resolution = view.getResolution()
  const pixelTolerance = options.pixelTolerance || 10
  const pointerCoordinate = event.coordinate
  const pixelCoordinates = R.map(map.getPixelFromCoordinate.bind(map))
  const squaredDistanceToSegment = Coordinate.squaredDistanceToSegment(pointerCoordinate)
  const pointOnSegment = Coordinate.closestOnSegment(pointerCoordinate)
  const withinTolerance = distance => distance <= pixelTolerance
  const originalEvent = event.originalEvent
  const removeCondition = () => altKeyOnly(event)

  const pixelDistance = point =>
    R.compose(Coordinate.distance, pixelCoordinates)([pointerCoordinate, point])

  const extent = (() => {
    const distance = resolution * pixelTolerance
    const x = pointerCoordinate[0]
    const y = pointerCoordinate[1]
    const extent = [x, y, x, y]
    return [
      extent[0] - distance,
      extent[1] - distance,
      extent[2] + distance,
      extent[3] + distance
    ]
  })()

  const closestSegment = rbush => {
    const nodes = rbush.getInExtent(extent)
    const segment = R.prop('segment')
    const uid = R.prop('ol_uid')
    const negate = n => n * -1
    const measure = squaredDistanceToSegment
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))
    const compareUID = compare(R.compose(negate, parseInt, uid))
    const compareChained = fns => (a, b) =>
      fns.reduce((acc, fn) => acc === 0 ? fn(a, b) : acc, 0)

    // First compare squared distances. If distance is same,
    // compare node's negated ol_uid. This assures that nodes added
    // later to index have precedence over those added before.
    return (nodes || []).sort(compareChained([
      compareDistance,
      compareUID
    ]))[0] // might be undefined
  }

  const closestPoint = (node, point) => {
    const squaredDistances = node.segment
      .map(coordinate => [coordinate, point])
      .map(pixelCoordinates)
      .map(Coordinate.squaredDistance)

    const minDistance = Math.sqrt(Math.min(...squaredDistances))

    // Either 0 for start vertex, 1 for end vertex or null
    // for point between start and end vertex:
    const index = withinTolerance(minDistance)
      ? squaredDistances[0] < squaredDistances[1]
        ? 0
        : 1
      : null

    const coordinate = index !== null
      ? node.segment[index]
      : point

    return { coordinate, index }
  }

  /**
   * Segment start or end vertex or point along segment if
   * not close enough to either vertex.
   */
  const coordinateWithinTolerance = node => {
    if (!node) return { coordinate: null }

    // Point on segment closest to current pointer coordinate:
    const point = pointOnSegment(node.segment)
    const distance = pixelDistance(point)
    if (!withinTolerance(distance)) return { coordinate: null }
    return closestPoint(node, point)
  }

  /**
   *
   */
  const segmentCoordinate = R.compose(coordinateWithinTolerance, closestSegment)

  return {
    pointOnSegment,
    pixelDistance,
    withinTolerance,
    pointerCoordinate,
    closestSegment,
    closestPoint,
    coordinateWithinTolerance,
    segmentCoordinate,
    originalEvent,
    removeCondition
  }
}
