import { createAction } from 'kbar'
import { isFeatureId } from '../../ids'

/**
 *
 */
export default function Style (options) {
  this.store = options.store
}

Style.prototype.actions = function (tuples) {
  return [
    this.smoothStyle(tuples)
  ]
}

Style.prototype.smoothStyle = function (tuples) {
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

  const action = enabled => {
    const newValues = oldValues.map(updatedStyle(enabled))
    return createAction({
      id: `style.smooth.${enabled}`,
      name: 'Style - Smooth: ' + (enabled ? 'Yes' : 'No'),
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return [action(true), action(false)]
}
