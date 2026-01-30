import { Modify } from './modify'
import { writeGeometryObject } from '../../ol/format'

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
    const props = feature.getProperties()

    // For circle measures, also persist the radius property
    if (typeof props.radius === 'number') {
      store.update([key], value => ({
        ...value,
        geometry,
        properties: { ...value.properties, radius: props.radius }
      }))
    } else {
      store.update([key], value => ({ ...value, geometry }))
    }
  })

  return interaction
}
