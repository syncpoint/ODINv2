import { Modify } from './modify'
// import { Modify } from './modify/index.original'
import { writeFeatureCollection } from '../../store/format'

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
    const geoJSON = writeFeatureCollection(event.features)
    clones = geoJSON.features
  })

  interaction.on('modifyend', event => {
    const { features } = writeFeatureCollection(event.features)
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      acc[0].push(feature)
      acc[1].push(clones[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
