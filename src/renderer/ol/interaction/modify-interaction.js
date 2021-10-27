import { primaryAction } from 'ol/events/condition'
import Modify from './Modify'
import { writeFeatureCollection } from '../../store/format'

const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

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
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey),
    hitTolerance
  })

  interaction.on('modifystart', ({ features }) => {
    const geoJSON = writeFeatureCollection(features.getArray())
    clones = geoJSON.features
  })

  interaction.on('modifyend', event => {
    const { features } = writeFeatureCollection(event.features.getArray())
    const [newValues, oldValues] = features.reduce((acc, feature, index) => {
      acc[0].push(feature)
      acc[1].push(clones[index])
      return acc
    }, ([[], []]))

    store.update(newValues, oldValues)
  })

  return interaction
}
