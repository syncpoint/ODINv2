import * as R from 'ramda'
import Event from 'ol/events/Event'
import { currentTime } from '@most/scheduler'
import { map } from '@most/core'
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
export const modifystart = feature => {
  const clone = feature.clone()
  clone.setId(feature.getId())
  return new ModifyEvent('modifystart', clone)
}

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
  // TODO: reference to test procedure

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
    const splitable = segment.splitable !== false
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
      : splitable
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
    return { segment, coordinate, index }
  }

  return pointer
}

/**
 * fromListeners :: [string] -> EventTarget -> Stream
 */
export const fromListeners = (types, target) => ({
  run: (sink, scheduler) => {
    const push = event => sink.event(currentTime(scheduler), event)
    types.forEach(type => target.addEventListener(type, push))

    return {
      dispose: () => types.forEach(type => target.removeEventListener(type, push))
    }
  }
})

export class Pipe {
  constructor (sink) { this.sink = sink }
  end (time) { this.sink.end(time) }
  error (time, err) { this.sink.end(time, err) }
}

class Op {
  constructor (sink, stream) {
    this.sink = sink
    this.stream = stream
  }

  run (sink, scheduler) {
    return this.stream.run(this.sink(sink), scheduler)
  }
}

class Replace {
  constructor (stream) {
    this.stream = stream
  }

  run (sink, scheduler) {
    return this.stream.run(new ReplaceSink(sink, scheduler), scheduler)
  }
}

class ReplaceSink extends Pipe {
  constructor (sink, scheduler) {
    super(sink)
    this.scheduler = scheduler
    this.disposable = {
      dispose: () => {}
    }
  }

  event (time, stream) {
    this.disposable.dispose()
    this.disposable = stream.run(this.sink, this.scheduler)
  }
}

/**
 * Flatten stream of arrays with depth = 1.
 */
class Flat {
  constructor (stream) {
    this.stream = stream
  }

  run (sink, scheduler) {
    this.stream.run(new FlatSink(sink), scheduler)
  }
}

class FlatSink extends Pipe {
  event (time, xs) {
    if (!Array.isArray(xs)) this.sink.event(time, xs)
    else xs.forEach(x => this.sink.event(time, x))
  }
}

export const flat = stream => new Flat(stream)
export const flatN = n => Array(n).fill(flat).reduce((f, g) => R.compose(g, f))

/**
 * replace, aka SwitchAll (RxJS)
 */
export const replace = stream => new Replace(stream)
export const orElse = value => map(that => that || value)
export const op = sink => stream => new Op(sink, stream)
export const pipe = ops => stream => ops.reduce((acc, op) => op(acc), stream)
