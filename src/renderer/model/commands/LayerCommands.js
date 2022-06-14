import { Command } from '../../commands/Command'
import { layerId } from '../../ids'

export default function LayerCommands (options) {
  this.store = options.store
  this.emitter = options.emitter
}

LayerCommands.prototype.commands = function (tuples) {
  console.log('[LayerCommands] commands', tuples)
  return [
    this.createLayer()
  ]
}

LayerCommands.prototype.createLayer = function () {
  const callback = value => {
    if (!value) return
    this.store.insert([[layerId(), { name: value }]])
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

/*
  const createLayerName =


  const setActiveLayerCommand = () => new Command({
    id: 'layer:setDefault',
    description: 'Layer: Make default',
    body: (dryRun) => {
      if (dryRun) return
      this.store.addTag(entries[0].id, 'default')
    }
  })

  const layerCount = entries.filter(entry => isLayerId(entry.id)).length
  if (layerCount === 0) return [createLayerCommand()]
  else if (layerCount === 1) return [setActiveLayerCommand()]
  else return []
*/
