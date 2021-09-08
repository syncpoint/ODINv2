import { click, platformModifierKeyOnly } from 'ol/events/condition'
import { Select } from 'ol/interaction'

const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 *
 */
export default options => {
  const { selection, partition, featureLayer, selectedLayer, hitTolerance, style } = options
  const interaction = new Select({
    hitTolerance,
    style,
    layers: [featureLayer, selectedLayer],
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false // don't select all features under cursor at once.
  })

  interaction.on('select', () => {
    // Propagate to global selection.
    // NOTE: selected, deselected are deltas/changes.
    const ids = features => features.map(feature => feature.getId())
    selection.set(ids(interaction.getFeatures().getArray()))
  })

  partition.getSelected().on('addfeature', ({ feature }) => {
    const features = interaction.getFeatures().getArray()
    if (!features.includes(feature)) interaction.getFeatures().push(feature)
  })

  partition.getSelected().on('removefeature', ({ feature }) => {
    const features = interaction.getFeatures().getArray()
    if (features.includes(feature)) interaction.getFeatures().remove(feature)
  })

  return interaction
}
