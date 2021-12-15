import * as R from 'ramda'
import { Coordinate } from './coordinate'

export const coordinate = coordinate => ({ type: 'coordinate', coordinate })
export const update = (clone, feature) => ({ type: 'update', clone, feature })

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

  const nodes = extent => extent
    ? rbush.getInExtent(extent).reverse()
    : []

  const sortBySquaredDistance = nodes => {
    const segment = R.prop('segment')
    const measure = Coordinate.squaredDistanceToSegment(event.coordinate)
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))
    return (nodes || []).sort(compareDistance)
  }

  const closestNode = R.compose(
    sortBySquaredDistance,
    nodes, // all nodes in extent | []
    extent // bounding square around pointer | null
  )

  const closestOnSegment = Coordinate.closestOnSegment(event.coordinate)

  const pixelCoordinate =
    coordinate =>
      coordinate
        ? map.getPixelFromCoordinate(coordinate)
        : null

  const pixelCoordinates = R.map(pixelCoordinate)
  const pixelDistance =
    coordinate =>
      R.compose(Coordinate.distance, pixelCoordinates)([event.coordinate, coordinate])

  /**
   * vertex :: Coordinate c => (options, event) -> node -> [c, index]
   */
  const vertex = node => {
    if (!node) return []

    const segment = node.segment
    const projectedCoordinate = closestOnSegment(segment)
    const distance = pixelDistance(projectedCoordinate) // might be Infinity

    if (!withinTolerance(distance)) return []

    const squaredPixelDistances = (xs, y) => xs
      .map(x => [x, y])
      .map(pixelCoordinates)
      .map(Coordinate.squaredDistance)

    const distances = squaredPixelDistances(segment, projectedCoordinate)
    const minDistance = Math.sqrt(Math.min(...distances))

    // (vertex) index :: null | 0 | 1
    // Either 0 for start vertex, 1 for end vertex or
    // null for point between start and end vertex:
    const index = withinTolerance(minDistance)
      ? distances[0] <= distances[1]
        ? 0
        : 1
      : null

    const coordinate = index !== null ? segment[index] : projectedCoordinate
    // TODO: also return pixel distance (insert state)
    return [coordinate, index]
  }

  pointer.withinTolerance = withinTolerance
  pointer.coordinate = event.coordinate
  pointer.originalEvent = event.originalEvent
  pointer.shiftKey = event.originalEvent.shiftKey
  pointer.altKey = event.originalEvent.altKey
  pointer.stopPropagation = event.stopPropagation.bind(event)
  pointer.closestOnSegment = closestOnSegment // TODO: replace with additional pixel distance in pick/vertex
  pointer.pixelDistance = pixelDistance // TODO: replace with additional pixel distance in pick/vertex

  pointer.pick = () => {
    if (pointer.shiftKey) return null
    const [node] = closestNode()
    const [coordinate, index] = vertex(node)
    return [node, coordinate, index]
  }

  return pointer
}
