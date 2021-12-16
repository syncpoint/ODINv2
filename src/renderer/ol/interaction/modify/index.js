import * as R from 'ramda'
import Interaction from 'ol/interaction/Interaction'
import Feature from 'ol/Feature'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import * as Subject from 'most-subject'
import * as M from '@most/core'
import { runEffects } from '@most/core'
import { newDefaultScheduler, currentTime } from '@most/scheduler'
import * as Events from './events'
import { writeIndex } from './writers'
import { setCoordinates } from '../../geometry'
import { pipe, fromListeners, replace, orElse, op, flat } from './frp'
import { selected } from './states'

/**
 * Sink for vertex feature overlay.
 * Accept coordinate events and update feature accordingly.
 */
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
export class Modify extends Interaction {

  constructor (options) {
    super(options)

    this.overlay = new OverlaySink(pointerStyles.DEFAULT, options)

    // Setup subject to receive map browser events:
    const [sink, event$] = Subject.create()
    this.next = event => Subject.event(currentTime(scheduler), event, sink)

    // Apply (rbush, event) to current state and update state accordingly.
    const eventLoop = (state, [rbush, event]) => {

      // For empty index, reset to loaded state:
      if (rbush.isEmpty()) return { seed: selected(true), value: Events.coordinate(null) }

      const pointer = Events.pointer(options, rbush, event)
      const handler = state[event.type]
      const [seed, value] = (handler && handler(pointer)) || [state, null]
      return { seed, value }
    }

    // Setup RBush stream from vector source add/remove
    // feature and feature change events:
    const rbush$ = Modify.rbush(options.source)

    const pipeline$ = pipe([

      // combine :: (a -> b -> c) -> Stream a -> Stream b -> Stream c
      // Apply a function to the most recent event from each Stream
      // when a new event arrives on any Stream.
      M.combine((rbush, event) => [rbush, event], rbush$),
      M.loop(eventLoop, selected(true)),
      M.filter(R.identity),
      flat,
      M.multicast
    ])(event$)

    // Coordinate path. Pipe coordinate events to overlay.
    const coordinate$ = pipe([
      M.filter(event => event.type === 'coordinate'),
      M.map(({ coordinate }) => coordinate),
      op(() => this.overlay)
    ])(pipeline$)

    // Update path. Pipe update events to store (indirectly).
    const update$ = pipe([
      M.filter(event => event.type === 'update'),
      M.tap(console.log)
    ])(pipeline$)

    const scheduler = newDefaultScheduler()
    runEffects(coordinate$, scheduler)
    runEffects(update$, scheduler)
  }

  handleEvent (event) {
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

      // Only one selected feature allowed:
      M.map(features => features.length === 1 ? features[0] : null),

      // Replace null with dummy feature without geometry:
      orElse(new Feature()),
      M.skipRepeats,

      // map :: RBush a => ol.Feature -> Stream a
      // Higher-order stream of RBush events.
      M.map(Modify.featureProxy),

      // Switch to new RBush stream as it arrives,
      // ending the previous stream. RBush events
      // are piped/flattened to output stream.
      replace
    ])

    const source$ = fromListeners(['addfeature', 'removefeature'], source)
    return pipeline(source$)
  }

  /**
   * createProxy :: RBush a => ol/Feature -> Stream a
   * Feature proxy with
   * @property coordinates - writable, geometry coordinates
   * @property commit - emit change event for feature
   */
  static featureProxy (feature) {
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

    // Simulate external change by emitting change event explicitly.
    proxy.commit = () => {
      // Must not happen inside this stack frame:
      const event = { type: 'change', target: feature }
      const dispatch = () => feature.dispatchEvent(event)
      setTimeout(dispatch, 0)
    }

    // Create new spatial index for each external change event:
    const pipeline = pipe([
      M.filter(() => !internalChange),
      M.map(() => writeIndex(proxy)),

      // Initial spatial index:
      M.startWith(writeIndex(proxy))
    ])

    const change$ = fromListeners(['change'], feature)
    return pipeline(change$)
  }

  setMap (map) {
    super.setMap(map)
    this.overlay.setMap(map)
  }
}

const pointerStyles = {}

pointerStyles.DEFAULT = [
  { radius: 7, stroke: new style.Stroke({ color: 'black', width: 3 }) },
  { radius: 7, stroke: new style.Stroke({ color: 'red', width: 2, lineDash: [3, 3] }) },
  { radius: 7, stroke: new style.Stroke({ color: 'white', width: 2, lineDash: [3, 3], lineDashOffset: 3 }) }
].map(options => new style.Style({ image: new style.Circle(options) }))
