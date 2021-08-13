import util from 'util'
import * as R from 'ramda'
import { descriptors, geometryType } from '../2525c'
import { isFeatureId } from './ids'
import { Command } from '../commands/Command'
import Emitter from '../../shared/emitter'

const types = Object.entries(descriptors).map(([sidc, descriptor]) => {
  return {
    sidc,
    geometry: descriptor.geometry.type,
    text: R.last(descriptor.hierarchy)
  }
})

export function PaletteEntries (selection, layerStore) {
  Emitter.call(this)

  this.selection_ = selection
  this.layerStore_ = layerStore
  this.entries_ = []

  selection.on('selection', this.handleSelection_.bind(this))
}

util.inherits(PaletteEntries, Emitter)


PaletteEntries.prototype.entries = function () {
  return this.entries_
}

PaletteEntries.prototype.handleSelection_ = async function () {
  const properties = await Promise.all(
    this.selection_.selected()
      .filter(isFeatureId)
      .map(id => this.layerStore_.getFeatureProperties(id))
  )

  const geometries = R.uniq(properties.map(({ sidc }) => geometryType(sidc)))
  if (geometries.length !== 1) this.entries_ = []
  else {
    const geometry = geometries[0]
    this.entries_ = types
      .filter(type => type.geometry === geometry)
      .map(type => new Command({
        description: type.text,
        body: () => console.log('yeah')
      }))
  }

  this.emit('palette/entries', this.entries_)
}
