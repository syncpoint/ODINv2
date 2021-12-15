import Pointer from 'ol/interaction/Pointer'
import { getUid } from 'ol/util.js'
import Event from 'ol/events/Event'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import * as style from 'ol/style'
import { setCoordinates } from '../../geometry'
import { rbush } from './writers'
import { idleState, loadedState } from './states'
import { message } from './message'

/**
 *
 */
class ModifyEvent extends Event {
  constructor (type, features, mapBrowserEvent) {
    super(type)
    this.features = features
    this.mapBrowserEvent = mapBrowserEvent
  }
}

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


/**
 *
 */
export class Modify extends Pointer {

  constructor (options) {
    super(options)
    this.options = options

    this.layer = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!options.wrapX
      }),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })


    if (!options.source) throw new Error('[Modify] source undefined')
    const source = options.source

    const proxies = []

    /**
     * Single-select: Create spatial index and move to LOADED state.
     * Multi-select: Move to IDLE state.
     */
    const featureAdded = ({ feature }) => {
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

      const uid = getUid(feature)
      proxies[uid] = new Proxy(feature, handlers)
      proxies[uid].dispose = () => {
        feature.removeEventListener('change', featureChanged)
        delete proxies[uid]
      }

      const featureChanged = () => {
        if (changingFeature) return
        this.state = loadedState(rbush(proxies[uid]))
      }

      // We only support modifying one feature at a time.
      const features = source.getFeatures()

      if (features.length > 1) this.state = idleState()
      else {
        feature.addEventListener('change', featureChanged)
        const handleClick = true
        this.state = loadedState(rbush(proxies[uid]), handleClick)
        this.handleEvent(this.lastEvent)
      }
    }

    /**
     * Move to IDLE state.
     */
    const featureRemoved = ({ feature }) => {
      const uid = getUid(feature)
      proxies[uid] && proxies[uid].dispose()
      this.state = idleState()
      this.handleEvent(this.lastEvent)
    }

    // TODO: remove listeners when interaction is detached from map.
    source.addEventListener('addfeature', featureAdded)
    source.addEventListener('removefeature', featureRemoved)

    this.state = idleState()
  }

  /**
   * handleEvent :: ol.MapBrowserEvent -> boolean
   * @return truthy - pass event on to next interaction in chain (unhandled)
   * @return falsy - don't pass event on to next interaction (handled)
   *
   * MapBrowserEvent.stopPropagation() has same effect as returning false.
   */
  handleEvent (event) {
    this.lastEvent = event

    const handler = this.state[event.type]
    if (!handler) return true
    else {
      const output = handler(message(this.options, event))

      // Only update pointer coordinate if defined, i.e. null or value:
      if (output.coordinate === null || output.coordinate) {
        this.updatePointerCoordinate(output.coordinate)
      }

      const { type, feature } = output
      if (type && feature) {
        this.dispatchEvent(new ModifyEvent(type, [feature], event))
      }

      this.state = output.state || this.state
      return output.propagate
    }
  }

  setMap (map) {
    this.layer.setMap(map)
    super.setMap(map)
  }

  updatePointerCoordinate (coordinate) {
    const source = this.layer.getSource()
    const feature = source.getFeatureById('feature:pointer')

    if (coordinate && !feature) {
      const pointer = new Feature(new Point(coordinate))
      pointer.setId('feature:pointer')
      pointer.setStyle(pointerStyles.DEFAULT)
      source.addFeature(pointer)
    } else if (coordinate && feature) {
      const geometry = feature.getGeometry()
      geometry.setCoordinates(coordinate)
    } else if (!coordinate && feature) {
      source.removeFeature(feature)
    }
  }
}
