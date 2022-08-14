import { createAction } from 'kbar'
import { isFeatureId } from '../../ids'
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
export default function Identity (options) {
  this.store = options.store
}

Identity.prototype.actions = function (tuples) {
  return [
    this.identity(tuples)
  ]
}

Identity.prototype.identity = function (tuples) {
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

    return createAction({
      id: `identity:${identity.code}`,
      name: `Identity - ${identity.name}`,
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return STANDARD_IDENTITIES.map(command)
}

