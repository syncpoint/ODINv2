import { Modify } from './modify'
import { writeGeometryObject } from '../../store/FeatureStore'

/**
 * @param {*} store
 * @param {*} selectedSource
 * @param {*} hitTolerance
 */
export default options => {
  const { services, sources, hitTolerance } = options
  const { store } = services
  const { modifiableSource } = sources

  const interaction = new Modify({
    source: modifiableSource,
    hitTolerance
  })

  interaction.on('modifyend', ({ feature }) => {
    const key = feature.getId()
    const geometry = writeGeometryObject(feature.getGeometry())
    store.update([key], value => ({ ...value, geometry }))
  })

  return interaction
}
