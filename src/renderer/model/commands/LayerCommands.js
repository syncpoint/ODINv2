import { Command } from '../../commands/Command'
import { layerId, isLayerId } from '../../ids'


/**
 *
 */
export default function LayerCommands (options) {
  this.store = options.store
  this.selection = options.selection
  this.emitter = options.emitter
}


/**
 *
 */
LayerCommands.prototype.commands = function (tuples) {
  return [
    this.createLayer(),
    this.setDefaultLayer(tuples)
  ]
}


/**
 *
 */
LayerCommands.prototype.createLayer = function () {
  const callback = value => {
    if (!value) return
    const key = layerId()
    this.selection.set([key])
    this.store.insert([[key, { name: value }]])
  }

  return new Command({
    id: 'layer:create',
    description: 'Layer: Create new',
    body: (dryRun) => {
      if (dryRun) return
      const event = { value: '', callback, placeholder: 'Layer Name' }
      this.emitter.emit('command/open-command-palette', event)
    }
  })
}


/**
 *
 */
LayerCommands.prototype.setDefaultLayer = function (tuples) {
  if (tuples.length !== 1) return []
  const layers = tuples.filter(([key]) => isLayerId(key))
  if (layers.length !== 1) return []

  return new Command({
    id: 'layer:setDefault',
    description: 'Layer: Make default',
    body: (dryRun) => {
      if (dryRun) return
      this.store.setDefaultLayer(tuples[0][0])
    }
  })
}
