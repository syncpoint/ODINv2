import * as R from 'ramda'
import { DragBox } from 'ol/interaction'
import { platformModifierKeyOnly } from 'ol/events/condition'

export default options => {
  const { selection, featureSource } = options

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
    const features = R.uniq(featureSource.getFeaturesInExtent(extent))

    // Toggle selections:
    const isSelected = feature => selection.isSelected(feature.getId())
    const [removals, additions] = R.partition(isSelected)(features)

    // selection.set(additions.map(feature => feature.getId()))
    // selection.deselect(removals.map(feature => feature.getId()))
    // selection.deselect(selection.selected(id => !featureSource.getFeatureById(id))) // not on map
    selection.select(additions.map(feature => feature.getId()))
  })

  return interaction
}
