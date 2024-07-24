import * as R from 'ramda'
import Event from 'ol/events/Event'
import { Coordinate } from './coordinate'

/**
 *
 */
export class ModifyEvent extends Event {
  constructor (type, feature) {
    super(type)
    this.feature = feature
  }
}


export const coordinate = coordinate => ({ type: 'coordinate', coordinate })
export const update = (clone, feature) => ({ type: 'update', clone, feature })
export const modifyend = feature => new ModifyEvent('modifyend', feature)

export const pointer = (options, rbush, event) => {
  const pixelTolerance = options.pixelTolerance || 10
  const withinTolerance = distance => distance <= pixelTolerance
  const map = event.map

  const pointer = {}

  const extent = () => {
    const view = map.getView()
    const resolution = view.getResolution()
    const d = resolution * pixelTolerance
    const [x, y] = event.coordinate
    return [x - d, y - d, x + d, y + d]
  }

  // Note: We reverse result from RBush in the hopes
  // that last added entries come first.
  // This is essential to disambiguate vertices sharing
  // the same coordinate. This is especially important
  // for corridors.

  const segments = extent => extent
    ? rbush.getInExtent(extent).reverse()
    : []

  const sortBySquaredDistance = segments => {
    const segment = R.prop('vertices')
    const measure = Coordinate.squaredDistanceToSegment(event.coordinate)
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))
    return (segments || []).sort(compareDistance)
  }

  const sortedSegments = R.compose(
    sortBySquaredDistance,
    segments, // all segments in extent | []
    extent // bounding square around pointer | null
  )

  const closestOnSegment = Coordinate.closestOnSegment(event.coordinate)

  const pixelCoordinate = coordinate => coordinate
    ? map.getPixelFromCoordinate(coordinate)
    : null

  const pixelCoordinates = R.map(pixelCoordinate)
  const pixelDistance = coordinate =>
    R.compose(Coordinate.distance, pixelCoordinates)([event.coordinate, coordinate])

  /**
   * vertex :: Coordinate c => segment -> [c, index]
   */
  const vertex = segment => {
    if (!segment) return []

    // Whether or not a vertex can be added between both vertices:
    const splittable = segment.splittable !== false
    const vertices = segment.vertices
    const projectedCoordinate = closestOnSegment(vertices)
    const distance = pixelDistance(projectedCoordinate) // might be Infinity

    // Pointer is too far from segment (off target):
    if (!withinTolerance(distance)) return []

    const squaredPixelDistances = (xs, y) => xs
      .map(x => [x, y])
      .map(pixelCoordinates)
      .map(Coordinate.squaredDistance)

    const distances = squaredPixelDistances(vertices, projectedCoordinate)
    const minDistance = Math.sqrt(Math.min(...distances))

    // (vertex) index :: null | 0 | 1
    // Either 0 for start vertex, 1 for end vertex or
    // null for point between start and end vertex:

    const index = withinTolerance(minDistance)
      ? distances[0] <= distances[1]
        ? 0
        : 1
      : undefined

    const coordinate = Number.isInteger(index)
      ? vertices[index]
      : splittable
        ? projectedCoordinate
        : undefined

    return [coordinate, index]
  }

  pointer.withinTolerance = withinTolerance
  pointer.coordinate = event.coordinate
  pointer.stopPropagation = event.stopPropagation.bind(event)
  pointer.condition = predicate => predicate(event)

  // Pixel distance of pointer coordinate to closest point on segment.
  pointer.pixelDistance = R.compose(pixelDistance, closestOnSegment)

  pointer.pick = () => {
    const [segment] = sortedSegments()
    const [coordinate, index] = vertex(segment)

    // Coordinate must never be undefined in order
    // to be handled correctly as a signal.
    return coordinate === undefined
      ? ({ segment, coordinate: null, index })
      : ({ segment, coordinate, index })

  }

  return pointer
}
