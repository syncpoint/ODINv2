import * as R from 'ramda'
import Interaction from 'ol/interaction/Interaction'
import Feature from 'ol/Feature'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import flyd from './flyd'

import * as Events from './events'
import { selected } from './states'
import { ModifyEvent } from './events'
import { setCoordinates } from '../../../model/geometry'
import { writeIndex } from './writers'


// rbush :: ol/Feature => Stream ol/structs/RBush
export const rbush = (() => {
  const changeEvents = feature => flyd.fromListeners(['change'], feature)
  let events

  return feature => {
    // End previous (if applicable) to release change listener:
    if (events) events.end(true)

    events = changeEvents(feature)
    const externalEvents = flyd.reject(({ target }) => target.internalChange(), events)
    const rbush = flyd.combine(() => writeIndex(feature), [externalEvents])
    return flyd.immediate(rbush)
  }
})()

const handlers = {
  set (target, property, value, proxy) {
    // coordinates setter on feature proxy:
    if (property === 'coordinates') {
      proxy.internalChange(true)
      setCoordinates(target.getGeometry(), value)
      proxy.internalChange(false)
      return true
    } else {
      return Reflect.set(target, property, value)
    }
  }
}

// TODO: extend and move to feature store
export const proxy = feature => {
  const proxy = new Proxy(feature, handlers)
  proxy.internalChange = flyd.stream(false)

  // Simulate external change by emitting change event explicitly.
  proxy.commit = () => proxy.dispatchEvent({ type: 'change', target: proxy })

  return proxy
}

class OverlaySink {
  constructor (style, options, coordinate) {
    const source = new VectorSource({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    })

    this.layer = new VectorLayer({
      source,
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })

    flyd.on(coordinate => {
      const feature = source.getFeatureById('feature:pointer')
      if (coordinate && !feature) {
        const pointer = new Feature(new Point(coordinate))
        pointer.setId('feature:pointer')
        pointer.setStyle(style)
        source.addFeature(pointer)
      } else if (coordinate && feature) {
        const geometry = feature.getGeometry()
        geometry.setCoordinates(coordinate)
      } else if (!coordinate && feature) {
        source.removeFeature(feature)
      }
    }, coordinate)
  }

  setMap (map) { this.layer.setMap(map) }
}

/**
 *
 */
export class Modify extends Interaction {

  constructor (options) {
    super(options)

    this.mapEvent$ = flyd.stream()

    // features :: ol/source/Vector => [ol/Feature]
    const features = source => source.getFeatures()

    // feature :: [ol/Feature] => ol/Feature
    // Single feature or placeholder feature without geometry.
    const feature = features =>
      features.length === 1
        ? features[0]
        : new Feature()

    // isSymbol :: ol/Feature => Boolean
    const isSymbol = feature => feature?.getGeometry()?.getType() === 'Point'

    const sourceEvents = flyd.fromListeners(['addfeature', 'removefeature'], options.source)
    const rbush$ = R.compose(
      flyd.chain(rbush),
      R.map(proxy),
      flyd.reject(isSymbol),
      R.map(feature),
      R.map(features),
      R.map(R.prop('target'))
    )(sourceEvents)

    const rbushEventPair$ =
      flyd.lift((rbush, event) => [rbush, event], rbush$, this.mapEvent$)

    const eventHandler = (state, [rbush, event]) => {
      // For empty index, reset to loaded state:
      if (rbush.isEmpty()) return [selected(true), Events.coordinate(null)]
      const pointer = Events.pointer(options, rbush, event)
      const handler = state[event.type]
      return (handler && handler(pointer)) || [state, null]
    }

    const looped = R.compose(
      flyd.reject(R.isNil),
      flyd.loop(eventHandler, selected(true))
    )(rbushEventPair$)

    const coordinate = R.compose(
      R.map(({ coordinate }) => coordinate),
      flyd.filter(event => event.type === 'coordinate'),
      flyd.reject(R.isNil)
    )(looped)

    const modifyEvent = R.compose(
      flyd.filter(event => event instanceof ModifyEvent)
    )(looped)

    // Effects: Update overlay feature coordinate, dispatch modify event
    this.overlay = new OverlaySink(pointerStyles.DEFAULT, options, coordinate)
    flyd.on(event => this.dispatchEvent(event), modifyEvent)
  }

  handleEvent (event) {
    this.mapEvent$(event)

    // Returning true will propagate event to next interaction,
    // unless stopPropagation() was called on event.
    return true
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
