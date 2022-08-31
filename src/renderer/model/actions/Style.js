import { createAction } from 'kbar'
import * as ID from '../../ids'

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
  const features = tuples.filter(([key]) => ID.isFeatureId(key))
  if (features.length === 0) return []

  // TODO: check precondition (lineString, polygon)

  const keys = features.map(([key]) => ID.styleId(key))

  const action = enabled => {
    return createAction({
      id: `style.smooth.${enabled}`,
      name: 'Style - Smooth: ' + (enabled ? 'Yes' : 'No'),
      perform: () => this.store.update(keys, style => ({
        ...style,
        'line-smooth': enabled
      }))
    })
  }

  return [action(true), action(false)]
}
