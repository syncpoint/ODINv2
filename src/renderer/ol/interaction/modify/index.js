import * as R from 'ramda'
import Pointer from 'ol/interaction/Pointer'
import Feature from 'ol/Feature'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import * as Subject from 'most-subject'
import * as M from '@most/core'
import { runEffects } from '@most/core'
import { newDefaultScheduler, currentTime } from '@most/scheduler'
import { Coordinate } from './coordinate'
import { rbush } from './writers'
import { setCoordinates } from '../../geometry'
import { pipe, fromListeners, replace, orElse, op } from './frp'
import { updateVertex, removeVertex, insertVertex } from './states'

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

/**
 *
 */
export class Modify extends Pointer {

  constructor (options) {
    super(options)

    this.overlay = new OverlaySink(pointerStyles.DEFAULT, options)

    // Setup subject to receive map browser events:
    const [sink, event$] = Subject.create()
    this.next = event => Subject.event(currentTime(scheduler), event, sink)

    const coordinateEvent = hit => hit
      ? { type: 'coordinate', coordinate: hit[1] }
      : null

    const updateEvent = (clone, feature) => ({
      type: 'update',
      clone,
      feature
    })

    const loaded = (handleClick = false) => {
      const pick = (rbush, event) => {
        if (event.originalEvent.shiftKey) return null
        const [node] = Modify.closestNode(options)(rbush, event)
        const [coordinate, index] = Modify.vertex(options, event)(node)
        return [node, coordinate, index]
      }

      return {
        id: 'LOADED',
        keydown: (_, event) => event.originalEvent.shiftKey ? [loaded(), []] : null,
        singleclick: (rbush, event) => [loaded(), handleClick ? coordinateEvent(pick(rbush, event)) : null],
        pointermove: (rbush, event) => [loaded(), coordinateEvent(pick(rbush, event))],
        pointerdown: (rbush, event) => {
          const hit = pick(rbush, event)
          if (!hit) return [loaded(), null]
          const [node, coordinate, index] = hit
          if (!node) return [loaded(), []]

          const feature = node.feature

          const state = node
            ? index !== null
              ? drag(feature, feature.clone(), updateVertex(node, index))
              : insert()
            : loaded()

          return [state, coordinateEvent(hit)]
        }
      }
    }

    const drag = (feature, clone, update) => {
      return {
        id: 'DRAG',
        pointermove: (_, event) => {
          const [coordinates, coordinate] = update(event.coordinate, event.originalEvent)
          feature.coordinates = coordinates
          return [drag(feature, clone, update), coordinateEvent([null, coordinate, null])]
        },
        pointerup: (_, event) => {
          feature.commit()
          return [loaded(), updateEvent(clone, feature)]
        }
      }
    }

    const insert = () => {
      console.log('[INSERT]')
      return {
        id: 'INSERT'
      }
    }

    const rbush$ = pipe([
      M.tap(event => console.log('RBUSH', event))
    ])(Modify.rbush(options.source))

    const pipeline$ = pipe([
      // combine :: (a -> b -> c) -> Stream a -> Stream b -> Stream c
      M.combine((rbush, event) => [rbush, event], rbush$),
      M.loop((state, [rbush, event]) => {
        console.log('[LOOP]', state.id, event.type, event.coordinate)
        // Reset loaded state to handle initial click event:
        if (rbush.isEmpty()) return { seed: loaded(true), value: null }

        const handler = state[event.type]
        const [seed, value] = (handler && handler(rbush, event)) || [state, null]

        // Consider event as handled when value is truthy:
        if (value) event.stopPropagation()

        return { seed, value }
      }, loaded(true)),
      M.filter(R.identity),
      M.multicast
    ])(event$)

    const coordinate$ = pipe([
      M.filter(event => event.type === 'coordinate'),
      M.map(({ coordinate }) => coordinate),
      op(() => this.overlay)
    ])(pipeline$)

    const update$ = pipe([
      M.filter(event => event.type === 'update'),
      M.tap(console.log)
    ])(pipeline$)

    const scheduler = newDefaultScheduler()
    runEffects(coordinate$, scheduler)
    runEffects(update$, scheduler)
  }

  /**
   * keydown, keypress, click, singleclick,
   * pointerdown, pointerup, pointermove, pointerdrag
   */
  handleEvent (event) {
    console.log('[handleEvent]', event.type, event.coordinate)
    this.next(event)

    // Returning true will propagate event to next interaction,
    // unless stopPropagation() was called on event.
    return true
  }

  /**
   * rbush :: RBush a => ol/VectorSource -> Stream a
   */
  static rbush (source) {
    const pipeline = pipe([
      M.map(({ target }) => target.getFeatures()),
      M.map(features => features.length === 1 ? features[0] : null),
      orElse(new Feature()), // feature without geometry
      M.skipRepeats,

      // map :: ol.Feature => Stream RBush
      // Higher-order stream of RBush events.
      M.map(Modify.createProxy),

      // Switch to new Stream RBush as it arrives,
      // ending the previous stream.
      replace
    ])

    return pipeline(fromListeners(['addfeature', 'removefeature'], source))
  }

  static createProxy (feature) {
    // feature change event: false -> external, true -> internal
    let internalChange = false

    const handlers = {
      set (target, property, value) {
        // coordinates setter on feature proxy:
        if (property === 'coordinates') {
          internalChange = true
          setCoordinates(target.getGeometry(), value)
          internalChange = false
          return true
        } else {
          return Reflect.set(target, property, value)
        }
      }
    }

    const proxy = new Proxy(feature, handlers)
    proxy.commit = () => {
      // Must not happen inside this stack frame:
      const event = { type: 'change', target: feature }
      const dispatch = () => feature.dispatchEvent(event)
      setTimeout(dispatch, 0)
    }

    // Create new spatial index for each 'external' change event:
    const pipeline = pipe([
      M.filter(() => !internalChange),
      M.map(() => rbush(proxy)),
      M.startWith(rbush(proxy)) // initial spatial index
    ])

    return pipeline(fromListeners(['change'], feature))
  }

  /**
   * node :: Options o, Rbush r, Event a => o -> (r, e) -> [node]
   */
  static closestNode (options) {
    return (rbush, event) => R.compose(
      Modify.sortBySquaredDistance(event),
      Modify.nodes(rbush), // all nodes in extent | []
      Modify.extent(options) // bounding square around pointer | null
    )(event)
  }

  /**
   * extent :: Options o, Event a => o -> a -> [n, n, n, n]
   */
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

  /**
   * nodes :: RBush r, Extent a => r -> a -> [node]
   * nodes :: RBush r => r -> null -> []
   */
  static nodes (rbush) {
    return extent => extent
      ? rbush.getInExtent(extent).reverse()
      : []
  }

  static sortBySquaredDistance (event) {
    const segment = R.prop('segment')
    const measure = Coordinate.squaredDistanceToSegment(event.coordinate)
    const compare = fn => (a, b) => fn(a) - fn(b)
    const compareDistance = compare(R.compose(measure, segment))
    return nodes => (nodes || []).sort(compareDistance)
  }

  /**
   * vertex :: Coordinate c => (options, event) -> node -> [c, index]
   */
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

const pointerStyles = {}

pointerStyles.DEFAULT = [
  new style.Style({
    image: new style.Circle({
      radius: 7, stroke: new style.Stroke({ color: 'black', width: 3, lineDash: [3, 3] })
    })
  }),
  new style.Style({
    image: new style.Circle({
      radius: 7, stroke: new style.Stroke({ color: 'red', width: 3, lineDash: [3, 3], lineDashOffset: 3 })
    })
  })
]
