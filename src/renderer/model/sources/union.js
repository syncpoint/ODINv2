import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'

/**
 * union :: ol/source/Vector S => [S] -> S
 */
export const union = (...sources) => {
  const union = new VectorSource({ features: new Collection() })

  sources.forEach(source => {
    union.addFeatures(source.getFeatures())
    source.on('addfeature', ({ feature }) => union.addFeature(feature))
    source.on('removefeature', ({ feature }) => union.removeFeature(union.getFeatureById(feature.getId())))
  })

  return union
}
