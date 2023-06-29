import * as R from 'ramda'
import Interaction from 'ol/interaction/Interaction'
import Feature from 'ol/Feature'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import Signal from '@syncpoint/signal'
import * as Events from './events'
import { selected } from './states'
import { ModifyEvent } from './events'
import { writeIndex } from './writers'

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

    this.dispose = Signal.on(coordinate => {
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

  setMap (map) {
    if (!map) this.dispose()
    this.layer.setMap(map)
  }
}

// rbush :: ol/Feature => Signal ol/structs/RBush
const rbush = (() => {
  let changeEvent

  return feature => {
    if (changeEvent) changeEvent.dispose()
    changeEvent = Signal.fromListeners(['change'], feature)
    return R.compose(
      Signal.startWith(() => writeIndex(feature)),
      R.map(({ target }) => writeIndex(target)),
      R.reject(({ target }) => target.internalChange())
    )(changeEvent)
  }
})()

/**
 *
 */
export class Modify extends Interaction {
  constructor (options) {
    super(options)

    // Receive map browser (mouse, keyboard) events.
    this.mapEvent = Signal.of()

    // feature :: [ol/Feature] => ol/Feature
    // Single feature or placeholder feature without geometry.
    const feature = features =>
      features.length === 1
        ? features[0]
        : new Feature()

    // isSymbol :: ol/Feature => Boolean
    const isSymbol = feature => feature?.getGeometry()?.getType() === 'Point'

    const sourceEvent = Signal.fromListeners(['addfeature', 'removefeature'], options.source)
    const spatialIndex = R.compose(
      R.chain(rbush),
      R.reject(isSymbol),
      R.map(feature),
      R.map(({ target }) => target.getFeatures())
    )(sourceEvent)

    // Map browser event in context of current spatial index.
    const spatialEvent =
      Signal.lift((rbush, event) => [rbush, event], spatialIndex, this.mapEvent)

    const eventHandler = (state, [rbush, event]) => {
      // For empty index, reset to loaded state:
      if (rbush.isEmpty()) return [selected(true), Events.coordinate(null)]
      const pointer = Events.pointer(options, rbush, event)
      const handler = state[event.type]
      return (handler && handler(pointer)) || [state, null]
    }

    const stateLoop = R.compose(
      R.reject(R.isNil),
      Signal.loop(eventHandler, selected(true))
    )(spatialEvent)

    const coordinate = R.compose(
      R.map(({ coordinate }) => coordinate),
      R.filter(event => event.type === 'coordinate'),
      R.reject(R.isNil)
    )(stateLoop)

    const modifyEvent = R.compose(
      Signal.filter(event => event instanceof ModifyEvent)
    )(stateLoop)

    // Effects: Update overlay feature coordinate, dispatch modify event
    this.overlay = new OverlaySink(pointerStyles.DEFAULT, options, coordinate)
    Signal.link(event => this.dispatchEvent(event), modifyEvent)
  }

  handleEvent (event) {
    this.mapEvent(event)

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
