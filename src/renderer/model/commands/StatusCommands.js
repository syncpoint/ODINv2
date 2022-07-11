import { isFeatureId } from '../../ids'
import { Command } from './Command'
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
export default function StatusCommands (options) {
  this.store = options.store
}

StatusCommands.prototype.commands = function (tuples) {
  return [
    this.status(tuples)
  ]
}

StatusCommands.prototype.status = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const command = status => {
    const updateStatus = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, { status: status.code })
      }
    })

    const newValues = oldValues.map(updateStatus)
    const body = dryRun => dryRun
      ? this.store.update(keys, newValues)
      : this.store.update(keys, newValues, oldValues)

    return new Command({
      id: `status:${status.code}`,
      description: `Status/Condition - ${status.name}`,
      body,
      revert: () => this.store.update(keys, oldValues)
    })
  }

  return STATUS.map(command)
}

