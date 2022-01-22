import { Translate } from 'ol/interaction'
import { writeFeatureCollection } from '../../model/geometry'
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition'

/**
 *
 */
export default (options, select) => {
  const { store, hitTolerance } = options

  // snapshot :: GeoJSON/FeatureCollection
  let snapshot = {}

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures(),
    condition: event => noModifierKeys(event) || shiftKeyOnly(event)
  })

  interaction.on('translatestart', event => {
    const features = event.features.getArray()
    snapshot = writeFeatureCollection(features)
  })

  interaction.on('translateend', async event => {
    const { features } = writeFeatureCollection(event.features.getArray())
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      acc[0].push(feature)
      acc[1].push(snapshot.features[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
