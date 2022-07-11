import * as R from 'ramda'
import * as MILSTD from '../../symbology/2525c'
import { isFeatureId } from '../../ids'
import { Command } from '../../commands/Command'

const type = ([parameterized, descriptor]) => ({
  parameterized,
  sidc: descriptor.sidc,
  geometry: descriptor.geometry.type,
  text: R.last(descriptor.hierarchy)
})

const TYPES = Object
  .entries(MILSTD.index)
  .map(type)


/**
 *
 */
export default function TypeCommands (options) {
  this.store = options.store
}

TypeCommands.prototype.commands = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  const geometryType = ([_, { properties }]) => MILSTD.geometryType(properties.sidc)
  const geometries = R.uniq(features.map(geometryType))
  if (geometries.length !== 1) return [] /* should be one geometry type only */

  const command = type => {
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

    const body = dryRun => dryRun
      ? this.store.update(keys, newValues)
      : this.store.update(keys, newValues, oldValues)

    return new Command({
      id: type.sidc,
      description: type.text,
      body,
      revert: () => this.store.update(keys, oldValues)
    })
  }

  return TYPES
    .filter(type => type.geometry === geometries[0])
    .map(command)
}
