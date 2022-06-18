import { isFeatureId } from '../../ids'
import { Command } from '../../commands/Command'
import * as MILSTD from '../../symbology/2525c'

const STANDARD_IDENTITIES = [
  { code: 'P', name: 'Pending' },
  { code: 'U', name: 'Unknown' },
  { code: 'F', name: 'Friend/Own' },
  { code: 'N', name: 'Neutral' },
  { code: 'H', name: 'Hostile/Enemy' },
  { code: 'A', name: 'Assumed Friend' },
  { code: 'S', name: 'Suspect' },
  { code: 'J', name: 'Joker' },
  { code: 'K', name: 'Faker' },
  { code: '-', name: 'None' }
]

/**
 *
 */
export default function IdentityCommands (options) {
  this.featureStore = options.featureStore
}

IdentityCommands.prototype.commands = function (tuples) {
  return [
    this.identity(tuples)
  ]
}

IdentityCommands.prototype.identity = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const command = identity => {
    const updateIdentity = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, { identity: identity.code })
      }
    })

    const newValues = oldValues.map(updateIdentity)
    const body = dryRun => dryRun
      ? this.featureStore.update(keys, newValues)
      : this.featureStore.update(keys, newValues, oldValues)

    return new Command({
      id: `identity:${identity.code}`,
      description: `Identity - ${identity.name}`,
      body,
      revert: () => this.featureStore.update(keys, oldValues)
    })
  }

  return STANDARD_IDENTITIES.map(command)
}

