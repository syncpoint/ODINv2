/* eslint-disable camelcase */
import * as Extent from 'ol/extent'
import { readFeature } from '../ol/format'

/**
 *
 */
export function FeatureStore (store) {
  this.store = store
}


/**
 *
 */
FeatureStore.prototype.center = async function (key) {
  const values = await this.store.values([key])
  if (values.length !== 1) return
  const feature = readFeature(values[0])
  const extent = feature.getGeometry()?.getExtent()
  return Extent.getCenter(extent)
}
