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
import { rbush } from './writers'
import { setCoordinates } from '../../geometry'
import { pipe, fromListeners, replace, orElse, op } from './frp'
import { loaded } from './states'

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

    const rbush$ = pipe([
      M.tap(event => console.log('RBUSH', event))
    ])(Modify.rbush(options.source))

    const eventLoop = (state, [rbush, event]) => {

      // For empty index, reset to loaded state:
      if (rbush.isEmpty()) return { seed: loaded(true), value: Events.coordinate(null) }

      const pointer = Events.pointer(options, rbush, event)
      const handler = state[event.type]
      const [seed, value] = (handler && handler(pointer)) || [state, null]
      return { seed, value }
    }

    const pipeline$ = pipe([
      // combine :: (a -> b -> c) -> Stream a -> Stream b -> Stream c
      M.combine((rbush, event) => [rbush, event], rbush$),
      M.loop(eventLoop, loaded(true)),
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
