import * as R from 'ramda'
import { click, platformModifierKeyOnly } from 'ol/events/condition'
import { Select } from 'ol/interaction'

const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 *
 */
export default options => {
  const { selection, hitTolerance, style, selectedSource } = options
  const interaction = new Select({
    hitTolerance,
    style,
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false // don't select all features under cursor at once.
  })

  const features = () => interaction.getFeatures().getArray()
  const selected = () => features().map(feature => feature.getId())

  // Propagate to global selection.
  // NOTE: selected, deselected are deltas/changes.
  interaction.on('select', () => selection.set(selected().filter(R.identity)))

  selectedSource.on('addfeature', ({ feature }) => {
    if (!features().includes(feature)) interaction.getFeatures().push(feature)
  })

  selectedSource.on('removefeature', ({ feature }) => {
    const features = interaction.getFeatures().getArray()
    if (features.includes(feature)) interaction.getFeatures().remove(feature)
  })

  return interaction
}
