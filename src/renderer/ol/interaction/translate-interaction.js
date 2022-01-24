import { Translate } from 'ol/interaction'
import { writeFeatureCollection } from '../../model/geometry'
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition'
const isEqual = require('react-fast-compare')

/**
 *
 */
export default (options, select) => {
  const { store, hitTolerance } = options

  // snapshot :: [GeoJSON/Feature]
  let snapshot = []

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures(),
    condition: event => noModifierKeys(event) || shiftKeyOnly(event)
  })

  // Inconvenient: translatestart/end is also triggered when
  // feature is simply clicked while already selected.
  // A 'dirty check' would be nice for translateend.

  interaction.on('translatestart', async event => {
    // Get full set of properties for each feature:
    const ids = event.features.getArray().map(feature => feature.getId())
    snapshot = await store.select(ids)
  })

  interaction.on('translateend', async event => {
    // Deep compare geometry and only update when changed:
    const { features } = writeFeatureCollection(event.features.getArray())
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      if (isEqual(feature.geometry, snapshot[index].geometry)) return acc

      // Only update geometry and keep remaining properties:
      acc[0].push({ ...snapshot[index], geometry: feature.geometry })
      acc[1].push(snapshot[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
