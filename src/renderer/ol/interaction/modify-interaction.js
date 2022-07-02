import { Modify } from './modify'
import { writeFeatureCollection } from '../../model/geometry'

/**
 * @param {*} store
 * @param {*} selectedSource
 * @param {*} hitTolerance
 */
export default options => {
  const { services, sources, hitTolerance } = options
  const { featureStore } = services
  const { modifiableSource } = sources

  // snapshot :: [[k, GeoJSON/Feature]]
  let snapshot = []

  const interaction = new Modify({
    source: modifiableSource,
    hitTolerance
  })

  interaction.on('modifystart', async ({ feature }) => {
    // Get full set of properties for feature:
    snapshot = await featureStore.tuples([feature.getId()])
  })

  interaction.on('modifyend', event => {
    const { features } = writeFeatureCollection([event.feature])

    const [keys, oldValues] = snapshot.reduce((acc, [key, value]) => {
      acc[0].push(key)
      acc[1].push(value)
      return acc
    }, [[], []])

    const newValues = features.map((feature, index) => ({
      ...snapshot[index][1],
      properties: feature.properties,
      geometry: feature.geometry
    }))

    featureStore.update(keys, newValues, oldValues)
  })

  return interaction
}
