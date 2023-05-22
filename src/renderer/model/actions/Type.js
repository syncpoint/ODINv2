import * as R from 'ramda'
import { createAction } from 'kbar'
import * as MILSTD from '../../symbology/2525c'
import { isFeatureId } from '../../ids'
import { svg } from '../../symbology/symbol'

const type = ([parameterized, descriptor]) => ({
  parameterized,
  sidc: descriptor.sidc,
  geometry: descriptor.geometry.type,
  text: R.last(descriptor.hierarchy)
})

const TYPES = Object
  .entries(MILSTD.symbols)
  .map(type)


/**
 *
 */
export default function Type (options) {
  this.store = options.store
}

Type.prototype.actions = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  const geometryType = ([_, { properties }]) => MILSTD.geometryType(properties.sidc)
  const geometries = R.uniq(features.map(geometryType))
  if (geometries.length !== 1) return [] /* should be one geometry type only */

  const action = type => {
    const formatOptions = {
      schema: MILSTD.schemaCode(type.sidc),
      battleDimension: MILSTD.battleDimensionCode(type.sidc),
      functionId: MILSTD.functionIdCode(type.sidc)
    }

    const updateSIDC = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, formatOptions)
      }
    })

    const keys = features.map(([key]) => key)
    const oldValues = features.map(([_, value]) => value)
    const newValues = oldValues.map(updateSIDC)

    return createAction({
      id: type.sidc,
      name: type.text,
      icon: svg(MILSTD.format(type.sidc, { identity: 'F', status: 'P' }), { size: 26 }),
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return TYPES
    .filter(type => type.geometry === geometries[0])
    .map(action)
}
