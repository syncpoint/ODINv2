import VectorSource from 'ol/source/Vector'
import * as ID from '../../ids'

/**
 * @deprecated
 */
export const featureSource = (featureStore, scope) => {
  const matchesScope = feature => feature
    ? ID.isId(scope)(feature.getId())
    : false

  const source = new VectorSource({ features: [] })

  featureStore.on('addfeatures', ({ features }) => {
    source.addFeatures(features.filter(matchesScope))
  })

  featureStore.on('removefeatures', ({ features }) => features
    .filter(matchesScope)
    .forEach(feature => source.removeFeature(feature))
  )

  return source
}
