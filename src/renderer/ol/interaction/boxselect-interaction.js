import * as R from 'ramda'
import { DragBox } from 'ol/interaction'
import { platformModifierKeyOnly } from 'ol/events/condition'

export default options => {
  const { selection, visibleSource } = options

  // Note: DragBox is not a selection interaction per se.
  // I.e. it does not manage selected features automatically.
  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxend', () => {

    // NOTE: Map rotation is not supported, yet.
    // See original source for implementation:
    // https://openlayers.org/en/latest/examples/box-selection.html

    // Collect features intersecting extent.
    const extent = interaction.getGeometry().getExtent()
    const features = R.uniq(visibleSource.getFeaturesInExtent(extent))
    const additions = features.filter(feature => !selection.isSelected(feature.getId()))
    selection.select(additions.map(feature => feature.getId()))
  })

  return interaction
}
