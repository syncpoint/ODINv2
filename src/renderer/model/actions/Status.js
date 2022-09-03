import { createAction } from 'kbar'
import { isFeatureId } from '../../ids'
import * as MILSTD from '../../symbology/2525c'

const STATUS = [
  { code: 'A', name: 'Anticipated/Planned' },
  { code: 'P', name: 'Present (Unit only)' },
  { code: 'C', name: 'Present/Fully Capable' },
  { code: 'D', name: 'Present/Fully Damaged' },
  { code: 'X', name: 'Present/Fully Destroyed' },
  { code: 'F', name: 'Present/Full to Capacity' }
]

/**
 *
 */
export default function Status (options) {
  this.store = options.store
}

Status.prototype.actions = function (tuples) {
  return [
    this.status(tuples)
  ]
}

Status.prototype.status = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const action = status => {
    const updateStatus = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, { status: status.code })
      }
    })

    const newValues = oldValues.map(updateStatus)

    return createAction({
      id: `status:${status.code}`,
      name: `Status/Condition - ${status.name}`,
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return STATUS.map(action)
}

