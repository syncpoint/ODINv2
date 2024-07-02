import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'

/**
 * intersect :: ol/source/Vector S => S -> S -> S
 */
export const intersect = (a, b) => {
  const intersection = new VectorSource({ features: new Collection() })

  a.on('addfeature', ({ feature: addition }) => {
    if (!b.getFeatureById(addition.getId())) return
    intersection.addFeature(addition)
  })

  a.on('removefeature', ({ feature: removal }) => {
    const feature = intersection.getFeatureById(removal.getId())
    if (feature) intersection.removeFeature(feature)
  })

  b.on('addfeature', ({ feature: addition }) => {
    if (!a.getFeatureById(addition.getId())) return
    intersection.addFeature(addition)
  })

  b.on('removefeature', ({ feature: removal }) => {
    const feature = intersection.getFeatureById(removal.getId())
    if (feature) intersection.removeFeature(feature)
  })

  return intersection
}
