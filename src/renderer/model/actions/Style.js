import * as R from 'ramda'
import { createAction } from 'kbar'
import * as ID from '../../ids'
import { geometry } from '../../symbology/2525c'

/**
 *
 */
export default function Style (options) {
  this.store = options.store
}

Style.prototype.actions = function (tuples) {
  return [
    this.smoothStyle(tuples),
    this.resetLayerStyles(tuples)
  ]
}

Style.prototype.smoothStyle = function (tuples) {
  const features = tuples.filter(([key, value]) => {
    if (!ID.isFeatureId(key)) return false

    const geom = geometry(value.properties.sidc)

    if (!geom) return false
    else if (geom.type === 'Polygon') return true
    else if (geom.type === 'LineString' && !geom.maxPoints) return true
    return false
  })

  // Dry-running on feature type may inadvertently change
  // feature properties until we hit smooth action.
  // We want to make sure feature properties are always
  // reset to their initial state.

  const lookup = features.reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})

  const entries = tuples
    .flatMap(([key, value]) => {
      return [
        [key, value],
        [ID.styleId(key), lookup[ID.styleId(key)] || {}]
      ]
    })

  if (entries.length === 0) return []

  const keys = entries.map(R.prop(0))
  const oldValues = entries.map(R.prop(1))

  const action = enabled => {
    const newValues = entries.map((entry) => {
      if (ID.isFeatureId(entry[0])) return entry[1]
      else return { ...entry[1], 'line-smooth': enabled }
    })

    return createAction({
      id: `style.smooth.${enabled}`,
      name: 'Style - Smooth: ' + (enabled ? 'Yes' : 'No'),
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return [action(true), action(false)]
}


/**
 *
 */
Style.prototype.resetLayerStyles = function (tuples) {
  const keys = tuples
    .filter(([key]) => ID.isLayerStyleId(key))
    .map(([key]) => key)

  return keys.length
    ? [createAction({
        id: 'style.layer.reset',
        name: 'Style - Reset Selected',
        perform: () => this.store.delete(keys)
      })]
    : []
}
