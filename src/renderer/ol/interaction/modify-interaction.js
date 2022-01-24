import { Modify } from './modify'
import { writeFeatureCollection } from '../../model/geometry'

/**
 * @param {*} store
 * @param {*} partition
 * @param {*} hitTolerance
 */
export default options => {
  const { store, partition, hitTolerance } = options

  // snapshot :: [GeoJSON/Feature]
  let snapshot = []

  const interaction = new Modify({
    source: partition.getSelected(),
    hitTolerance
  })

  interaction.on('modifystart', async ({ feature }) => {
    // Get full set of properties for feature:
    const ids = [feature.getId()]
    snapshot = await store.select(ids)
  })

  interaction.on('modifyend', event => {
    const { features } = writeFeatureCollection([event.feature])
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      acc[0].push({
        ...snapshot[index],
        properties: feature.properties,
        geometry: feature.geometry
      })
      acc[1].push(snapshot[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
