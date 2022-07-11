import * as R from 'ramda'
import { isFeatureId } from '../../ids'
import { Command } from '../../commands/Command'

const MODIFIERS = [
  ['Modifier: Quantity (C)', 'c'],
  ['Modifier: Staff Comments (G)', 'g'],
  ['Modifier: Additional Information (H)', 'h'],
  ['Modifier: Higher Formation (M)', 'm'],
  ['Modifier: IFF/SIF (P)', 'p'],
  ['Modifier: Direction (Q)', 'q'],
  ['Modifier: Unique Designation (T)', 't'],
  ['Modifier: Unique Designation (T1)', 't1'],
  ['Modifier: Type (V)', 'v'],
  ['Modifier: Date-Time Group (W)', 'w'],
  ['Modifier: Date-Time Group (W1)', 'w1'],
  ['Modifier: Altitude/Depth (X)', 'x'],
  ['Modifier: Speed (Z)', 'z']
]

/**
 *
 */
export default function ModifierCommands (options) {
  this.store = options.store
  this.emitter = options.emitter
}

ModifierCommands.prototype.commands = function (tuples) {
  return [
    this.modifiers(tuples)
  ]
}

ModifierCommands.prototype.modifiers = function (tuple) {
  const features = tuple.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const command = ([description, property]) => {
    const values = oldValues
      .map(R.prop('properties'))
      .map(R.prop(property))
      .filter(R.identity)

    const uniqueValues = R.uniq(values)
    const value = uniqueValues.length === 1
      ? uniqueValues[0] // one unique value
      : uniqueValues.length === 0
        ? '' // undefined/no value
        : null // multiple values

    const placeholder = value === null
      ? 'M/V (edit or return to delete)'
      : null

    const callback = value => {
      const updateModifier = feature => {
        const properties = { ...feature.properties }
        properties[property] = value
        return { ...feature, properties }
      }

      const newValues = oldValues.map(updateModifier)
      this.store.update(keys, newValues, oldValues)
    }

    return new Command({
      description,
      id: `property:${property}`,
      body: (dryRun) => {
        if (dryRun) return
        const event = { value, callback, placeholder }
        this.emitter.emit('command/open-command-palette', event)
      }
    })
  }

  return MODIFIERS.map(command)
}
