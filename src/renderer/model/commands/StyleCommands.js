import { isFeatureId } from '../../ids'
import { Command } from '../../commands/Command'

/**
 *
 */
export default function StyleCommands (options) {
  this.featureStore = options.featureStore
}

StyleCommands.prototype.commands = function (tuples) {
  return [
    this.smoothStyle(tuples)
  ]
}

StyleCommands.prototype.smoothStyle = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  // TODO: check precondition (lineString, polygon)

  const updatedStyle = enabled => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      style: {
        ...feature.properties.style,
        smooth: enabled
      }
    }
  })

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const command = enabled => {
    const newValues = oldValues.map(updatedStyle(enabled))

    const body = dryRun => dryRun
      ? this.featureStore.update(keys, newValues)
      : this.featureStore.update(keys, newValues, oldValues)

    return new Command({
      id: `style.smooth.${enabled}`,
      description: 'Style: Smooth - ' + (enabled ? 'Yes' : 'No'),
      body,
      revert: () => this.featureStore.update(keys, oldValues)
    })
  }

  return [command(true), command(false)]
}
