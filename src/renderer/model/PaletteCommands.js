import util from 'util'
import * as R from 'ramda'
import * as MIL_STD from '../2525c'
import { isFeatureId } from './ids'
import { Command } from '../commands/Command'
import Emitter from '../../shared/emitter'

const capitalize = s => s.toLowerCase()
  .split(' ')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')


const types = Object.entries(MIL_STD.index).map(([parameterized, descriptor]) => {
  return {
    parameterized,
    sidc: descriptor.sidc,
    geometry: descriptor.geometry.type,
    text: capitalize(R.last(descriptor.hierarchy))
  }
})


export function PaletteCommands (selection, layerStore) {
  Emitter.call(this)

  this.selection_ = selection
  this.layerStore_ = layerStore
  this.entries_ = []

  selection.on('selection', this.handleSelection_.bind(this))
}

util.inherits(PaletteCommands, Emitter)


PaletteCommands.prototype.entries = function () {
  return this.entries_
}

PaletteCommands.prototype.handleSelection_ = async function () {
  const properties = await Promise.all(
    this.selection_.selected()
      .filter(isFeatureId)
      .map(id => this.layerStore_.getFeatureProperties(id))
  )

  const oldProperties = this.selection_.selected().map((id, index) => ({ id, ...properties[index] }))
  const geometries = R.uniq(properties.map(({ sidc }) => MIL_STD.geometryType(sidc)))

  if (geometries.length !== 1) this.entries_ = []
  else {
    const geometry = geometries[0]
    this.entries_ = types
      .filter(type => type.geometry === geometry)
      .map(type => {
        const options = {
          schema: MIL_STD.schema(type.sidc),
          battleDimension: MIL_STD.battleDimension(type.sidc),
          functionId: MIL_STD.functionId(type.sidc)
        }

        return new Command({
          id: type.sidc,
          description: type.text,
          body: () => {
            const newProperties = oldProperties.map(properties => ({
              ...properties,
              sidc: MIL_STD.format(properties.sidc, options)
            }))

            this.layerStore_.updateProperties(newProperties)
          }
        })
      })
  }

  this.emit('palette/entries', this.entries_)
}
