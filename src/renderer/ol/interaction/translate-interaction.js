import { Translate } from 'ol/interaction'
import { writeFeatureCollection } from '../../model/geometry'
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition'
const isEqual = require('react-fast-compare')

/**
 *
 */
export default options => {
  const { services, sources, hitTolerance } = options
  const { modifiableSource } = sources
  const { featureStore } = services

  // snapshot :: [GeoJSON/Feature]
  let snapshot = []

  const interaction = new Translate({
    hitTolerance,
    features: modifiableSource.getFeaturesCollection(),
    condition: event => noModifierKeys(event) || shiftKeyOnly(event)
  })

  // Inconvenient: translatestart/end is also triggered when
  // feature is simply clicked while already selected.
  // A 'dirty check' would be nice for translateend.

  interaction.on('translatestart', async event => {
    // Get full set of properties for each feature:
    const ids = event.features.getArray().map(feature => feature.getId())
    snapshot = await featureStore.values(ids)
  })

  interaction.on('translateend', async event => {
    // Deep compare geometry and only update when changed:
    const { features } = writeFeatureCollection(event.features.getArray())
    const [keys, newValues] = features.reduce((acc, feature, index) => {
      const { id: key, ...value } = feature
      if (isEqual(feature.geometry, snapshot[index].geometry)) return acc

      // Only update geometry and keep remaining properties:
      acc[0].push(key)
      acc[1].push({ ...snapshot[index], geometry: value.geometry })
      return acc
    }, ([[], []]))

    featureStore.update(keys, newValues, snapshot)
  })

  return interaction
}
