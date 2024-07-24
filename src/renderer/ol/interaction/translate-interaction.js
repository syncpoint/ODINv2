import * as R from 'ramda'
import { Translate } from 'ol/interaction'
import { writeFeatureCollection } from '../../ol/format'
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition'

/**
 *
 */
export default options => {
  const { services, sources, hitTolerance } = options
  const { modifiableSource } = sources
  const { store } = services

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
    snapshot = await store.values(ids)
  })

  interaction.on('translateend', async event => {
    // Deep compare geometry and only update when changed:
    const { features } = writeFeatureCollection(event.features.getArray())
    const keys = features.map(R.prop('id'))
    const merge = (feature, index) => ({ ...snapshot[index], geometry: feature.geometry })
    const newValues = features.map(merge)
    store.update(keys, newValues, snapshot)
  })

  return interaction
}
