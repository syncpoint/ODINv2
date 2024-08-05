import bbox from 'geojson-bbox'
import * as ID from '../../ids'
import FlatRBush from './FlatRBush'

export default async store => {
  const rbush = new FlatRBush()
  const items = [
    ...await store.tuples(ID.FEATURE_SCOPE),
    ...await store.tuples(ID.MARKER_SCOPE),
    ...await store.tuples(ID.MEASURE_SCOPE)
  ].map(([id, feature]) => [...bbox(feature), id])
  rbush.load(items)
  return rbush
}
