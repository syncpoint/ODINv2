import { defaults as defaultInteractions } from 'ol/interaction'
import selectInteraction from './select-interaction'
import translateInteraction from './translate-transaction'
import modifyInteraction from './modify-interaction'
import snapInteraction from './snap-interaction'

/**
 * @param {Selection} selection
 * @param {LayerStore} layerStore
 * @param {Undo} undo
 * @param {Partition} partition
 * @param {ol/VectorLayer} featureLayer
 * @param {ol/VectorLayer} selectedLayer
 * @param {ol/VectorSource} featureSource source for all features
 */
export default options => {
  const select = selectInteraction(options)
  const modify = modifyInteraction(options)
  const translate = translateInteraction(options, select)
  const snap = snapInteraction(options)
  return defaultInteractions({ doubleClickZoom: false }).extend(
    [select, translate, modify, snap]
  )
}
