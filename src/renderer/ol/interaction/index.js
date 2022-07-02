import { defaults as defaultInteractions } from 'ol/interaction'
import selectInteraction from './select-interaction'
import translateInteraction from './translate-interaction'
import cloneInteraction from './clone-interaction'
import modifyInteraction from './modify-interaction'
import snapInteraction from './snap-interaction'
import boxselectInteraction from './boxselect-interaction'
import drawInteraction from './draw-interaction'

/**
 *
 */
export default options => {
  const select = selectInteraction(options)
  const clone = cloneInteraction(options)
  const translate = translateInteraction(options)
  const boxselect = boxselectInteraction(options)
  const modify = modifyInteraction(options)
  const snap = snapInteraction(options)

  // Draw interaction is dynamically added to map as required.
  drawInteraction(options)

  const interactions = defaultInteractions({ doubleClickZoom: false }).extend(
    // Events are delegated from right to left.
    // For example: CMD/pointerdown would not be delegates to modify
    // interaction if boxelect is placed before (right of) modify.
    // boxelect consumes CMD/pointerdown.
    [select, clone, translate, boxselect, modify, snap]
  )

  const { map } = options
  interactions.getArray().forEach(interaction => map.addInteraction(interaction))
}
