import { defaults as defaultInteractions } from 'ol/interaction'
import selectInteraction from './select-interaction'
import translateInteraction from './translate-interaction'
import cloneInteraction from './clone-interaction'
import modifyInteraction from './modify-interaction'
import snapInteraction from './snap-interaction'
import boxselectInteraction from './boxselect-interaction'
import drawInteraction from './draw-interaction'

/**
 * @param {Selection} selection
 * @param {Store} store
 * @param {Undo} undo
 * @param {Partition} partition
 * @param {ol/VectorLayer} featureLayer
 * @param {ol/VectorLayer} selectedLayer
 * @param {ol/VectorSource} featureSource source for all features
 * @param {EventEmitter} emitter
 * @param {ol/Map} map
 */
export default options => {

  const select = selectInteraction(options)
  const modify = modifyInteraction(options)
  const translate = translateInteraction(options)
  const clone = cloneInteraction(options)
  const snap = snapInteraction(options)
  const boxselect = boxselectInteraction(options)

  // Draw interaction is dynamically added to map as required.
  drawInteraction(options)

  return defaultInteractions({ doubleClickZoom: false }).extend(
    // Events are delegated from right to left.
    // For example: CMD/pointerdown would not be delegates to modify
    // interaction if boxelect is placed before (right of) modify.
    // boxelect consumes CMD/pointerdown.
    [select, clone, translate, boxselect, modify, snap]
  )
}
