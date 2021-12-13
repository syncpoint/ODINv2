import * as R from 'ramda'
import Pointer from 'ol/interaction/Pointer'
import Feature from 'ol/Feature'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import {
  squaredDistanceToSegment,
  closestOnSegment,
  distance,
  squaredDistance,
  equals
} from 'ol/coordinate'

import * as Subject from 'most-subject'
import { runEffects, map, skipRepeats, filter, startWith, ap, multicast, throttle, debounce, merge, constant, tap } from '@most/core'
import { newDefaultScheduler, currentTime } from '@most/scheduler'
import { rbush } from './writers'
import { setCoordinates } from '../../geometry'
import { log, pipe, fromListeners, replace, orElse, op, Pipe } from './frp'

const radius = 7
const width = 3
const pointerStyles = {}

pointerStyles.DEFAULT = new style.Style({
  zIndex: Infinity,
  image: new style.Circle({
    radius,
    stroke: new style.Stroke({ color: 'red', width })
  })
})

export const lazy = function (fn) {
  let evaluated = false
  let value

  return function () {
    if (evaluated) return value
    value = fn.apply(this, arguments)
    evaluated = true
    return value
  }
}

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

export class OverlaySink {
  constructor (style, options) {
    const source = new VectorSource({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    })

    this.style = style
    this.layer = new VectorLayer({
      source,
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })
  }

  setMap (map) { this.layer.setMap(map) }
  end (time) { console.log('[OverlaySink] end') }
  error (time, err) { console.error('[OverlaySink] error', err) }

  event (time, coordinate) {
    const source = this.layer.getSource()
    const feature = source.getFeatureById('feature:pointer')

    if (coordinate && !feature) {
      const pointer = new Feature(new Point(coordinate))
      pointer.setId('feature:pointer')
      pointer.setStyle(this.style)
      source.addFeature(pointer)
    } else if (coordinate && feature) {
      const geometry = feature.getGeometry()
      geometry.setCoordinates(coordinate)
    } else if (!coordinate && feature) {
      source.removeFeature(feature)
    }
  }
}

// Event sequence: select featue (select <-> modify)
// pointerdown
// pointerup
// click
// singleclick

/**
 *
 */
export class Modify extends Pointer {

  constructor (options) {
    super(options)

    this.overlay = new OverlaySink(pointerStyles.DEFAULT, options)

    // Setup subject to receive map browser events:
    const [sink, event$] = Subject.create()

    const multicast$ = pipe([
      multicast
    ])(event$)
    this.next = event => Subject.event(currentTime(scheduler), event, sink)

    const rbush$ = Modify.rbushStream(options.source)
    const handle = rbush => event => {

      // If pointer event made it this far, we mark it as handled:
      event.stopPropagation()

      const [node] = Modify.node(options)(rbush)(event)
      const [coordinate, index] = Modify.vertex(options, event)(node)
      return [node, coordinate, index]
    }

    const pointer$ = pipe([
      filter(({ originalEvent }) => originalEvent instanceof PointerEvent),
      filter(({ originalEvent }) => !originalEvent.shiftKey),
      ap(map(handle, rbush$)),
      map(([node, coordinate, index]) => coordinate),
      op(() => this.overlay)
    ])(multicast$)

    const key$ = pipe([
      filter(({ originalEvent }) => originalEvent instanceof KeyboardEvent),
      filter(({ originalEvent }) => originalEvent.shiftKey),
      constant([null, null, null])
    ])(multicast$)

    const merge$ = pipe([
      op(() => this.overlay)
    ])(merge(pointer$, key$))

    const scheduler = newDefaultScheduler()
    runEffects(merge$, scheduler)
  }

  handleEvent (event) {
    console.log('[handleEvent]', event.type)
    this.next(event)

    // Returning true will propagate event to next interaction,
    // unless stopPropagation() was called on event.
    return true
  }

  static rbushStream (source) {
    const pipeline = pipe([
      map(({ target }) => target.getFeatures()),
      map(features => features.length === 1 ? features[0] : null),
      orElse(new Feature()), // feature without geometry
      skipRepeats,

      // map :: ol.Feature => Stream RBush
      // Higher-order stream of RBush events.
      map(Modify.createProxy),

      // Switch to new Stream RBush as it arrives,
      // ending the previous stream.
      replace
    ])

    return pipeline(fromListeners(['addfeature', 'removefeature'], source))
  }

  static createProxy (feature) {
    let changingFeature = false

    const handlers = {
      set (target, property, value) {
        if (property === 'coordinates') {
          changingFeature = true
          setCoordinates(target.getGeometry(), value)
          changingFeature = false
          return true
        } else {
          return Reflect.set(target, property, value)
        }
      }
    }

    const proxy = new Proxy(feature, handlers)

    // Create new spatial index for each 'external' change event:
    const pipeline = pipe([
      filter(() => !changingFeature),
      map(() => rbush(proxy)),
      startWith(rbush(proxy)) // initial spatial index
    ])

    return pipeline(fromListeners(['change'], feature))
  }

  static node (options) {
    return rbush => event => R.compose(
      Modify.sortBySquaredDistance(event),
      Modify.nodes(rbush), // all nodes in extent
      Modify.extent(options) // bounding square around pointer
    )(event)
  }

  static extent (options) {
    const pixelTolerance = options.pixelTolerance || 10

    return event => {
      const map = event.map
      const view = map.getView()
      const resolution = view.getResolution()
      const d = resolution * pixelTolerance
      const [x, y] = event.coordinate
      return [x - d, y - d, x + d, y + d]
    }
  }

  static nodes (rbush) {
    return extent => rbush.getInExtent(extent).reverse()
  }

  static sortBySquaredDistance (event) {
    const segment = R.prop('segment')
    const measure = Coordinate.squaredDistanceToSegment(event.coordinate)
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))
    return nodes => (nodes || []).sort(compareDistance)
  }

  static vertex (options, event) {
    const pixelTolerance = options.pixelTolerance || 10
    const withinTolerance = distance => distance <= pixelTolerance

    return node => {
      if (!node) return []

      const segment = node.segment

      // closestOnSegment :: Coordinate c => [c, c] => c
      const closestOnSegment = Coordinate.closestOnSegment(event.coordinate)
      const pixelCoordinate = coordinate => coordinate ? event.map.getPixelFromCoordinate(coordinate) : null
      const pixelCoordinates = R.map(pixelCoordinate)
      const pixelDistance = R.compose(Coordinate.distance, pixelCoordinates)

      const projectedCoordinate = closestOnSegment(segment)
      const distance = pixelDistance([event.coordinate, projectedCoordinate]) // might be Infinity
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
      const index = withinTolerance(minDistance) ? distances[0] <= distances[1] ? 0 : 1 : null
      const coordinate = index !== null ? segment[index] : projectedCoordinate
      return [coordinate, index]
    }
  }

  setMap (map) {
    super.setMap(map)
    this.overlay.setMap(map)
  }
}
