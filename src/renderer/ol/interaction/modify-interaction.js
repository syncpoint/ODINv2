import { primaryAction } from 'ol/events/condition'
import Modify from './Modify'

const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 * @param {*} layerStore
 * @param {*} undo
 * @param {*} partition
 * @returns
 */
export default options => {
  const { layerStore, partition, hitTolerance } = options
  let clones = [] // Cloned geometries BEFORE modify.

  const interaction = new Modify({
    source: partition.getSelected(),
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey),
    snapToPointer: false, // FIXME: does this really prevent snapping?
    hitTolerance
  })

  interaction.on('modifystart', ({ features }) => {
    clones = features.getArray().map(feature => feature.getGeometry().clone())
  })

  interaction.on('modifyend', ({ features }) => {
    const geometries = features.getArray().reduce((acc, feature, index) => {
      acc[feature.getId()] = [
        feature.getGeometry(),
        clones[index]
      ]
      return acc
    }, {})

    layerStore.updateGeometries(geometries)
  })

  return interaction
}
