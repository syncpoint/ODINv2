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
  const pixelTolerance = options.pixelTolerance || 10

  const map = event.map // !
  const view = map.getView() // !
  const resolution = view.getResolution() // !
  const pointerCoordinate = event.coordinate // !
  const pixelCoordinate = R.map(map.getPixelFromCoordinate.bind(map)) // !
  const squaredDistanceToSegment = Coordinate.squaredDistanceToSegment(pointerCoordinate) // !
  const pointOnSegment = Coordinate.closestOnSegment(pointerCoordinate) // !
  const pixelDistance = point => R.compose(Coordinate.distance, pixelCoordinate)([pointerCoordinate, point]) // !
  const extent = (() => {
    const d = resolution * pixelTolerance
    const [x, y] = pointerCoordinate
    return [x - d, y - d, x + d, y + d]
  })() // !


  const withinTolerance = distance => distance <= pixelTolerance
  const originalEvent = event.originalEvent
  const removeCondition = () => altKeyOnly(event)

  const closestSegment = rbush => {
    const nodes = rbush.getInExtent(extent).reverse()
    const segment = R.prop('segment')
    const measure = squaredDistanceToSegment
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))


    const sortedNodes = (nodes || []).sort(compareDistance)
    return sortedNodes[0]
  }


  const closestPoint = (node, point) => {
    const squaredDistances = node.segment
      .map(coordinate => [coordinate, point])
      .map(pixelCoordinate)
      .map(Coordinate.squaredDistance)

    const minDistance = Math.sqrt(Math.min(...squaredDistances))

    // Either 0 for start vertex, 1 for end vertex or null
    // for point between start and end vertex:
    const index = withinTolerance(minDistance)
      ? squaredDistances[0] <= squaredDistances[1]
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
