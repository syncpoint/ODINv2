import { Modify } from './modify'
import { writeFeatureCollection } from '../../model/geometry'

/**
 * @param {*} store
 * @param {*} partition
 * @param {*} hitTolerance
 */
export default options => {
  const { store, partition, hitTolerance } = options
  let clones = [] // Cloned features BEFORE modify.

  const interaction = new Modify({
    source: partition.getSelected(),
    hitTolerance
  })

  interaction.on('modifystart', event => {
    const geoJSON = writeFeatureCollection([event.feature])
    clones = geoJSON.features
  })

  interaction.on('modifyend', event => {
    const { features } = writeFeatureCollection([event.feature])
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      acc[0].push(feature)
      acc[1].push(clones[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
