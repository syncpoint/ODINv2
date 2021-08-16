import util from 'util'
import * as R from 'ramda'
import * as MIL_STD from '../2525c'
import { isFeatureId } from './ids'
import { Command } from '../commands/Command'
import Emitter from '../../shared/emitter'


const ALL_TYPES = Object.entries(MIL_STD.index).map(([parameterized, descriptor]) => {
  return {
    parameterized,
    sidc: descriptor.sidc,
    geometry: descriptor.geometry.type,
    text: R.last(descriptor.hierarchy)
  }
})


/**
 * @constructor
 */
export function PaletteCommands (selection, layerStore, undo) {
  Emitter.call(this)

  this.selection_ = selection
  this.layerStore_ = layerStore
  this.undo_ = undo
  this.entries_ = []

  selection.on('selection', this.handleSelection_.bind(this))
}

util.inherits(PaletteCommands, Emitter)


/**
 *
 */
PaletteCommands.prototype.entries = function () {
  return this.entries_
}


/**
 *
 */
PaletteCommands.prototype.handleSelection_ = async function () {
  const properties = await Promise.all(
    this.selection_.selected()
      .filter(isFeatureId)
      .map(id => this.layerStore_.getFeatureProperties(id))
  )

  this.entries_ = []
  this.entries_.push(...this.typeCommands_(properties))
  this.entries_.push(...this.styleSmoothCommands_(properties))

  this.entries_.sort((a, b) => a.description().localeCompare(b.description()))
  this.emit('palette/entries', this.entries_)
}


/**
 *
 */
PaletteCommands.prototype.typeCommands_ = function (properties) {
  const geometries = R.uniq(properties.map(({ sidc }) => MIL_STD.geometryType(sidc)))
  if (geometries.length !== 1) return []


  const command = type => {
    const update = this.layerStore_.commands.updateProperties.bind(this.layerStore_)
    const options = {
      schema: MIL_STD.schema(type.sidc),
      battleDimension: MIL_STD.battleDimension(type.sidc),
      functionId: MIL_STD.functionId(type.sidc)
    }

    return new Command({
      id: type.sidc,
      description: type.text,
      body: () => {
        this.undo_.apply(update(properties, properties.map(properties => ({
          ...properties,
          sidc: MIL_STD.format(properties.sidc, options)
        }))))
      }
    })
  }

  return ALL_TYPES
    .filter(type => type.geometry === geometries[0])
    .map(type => command(type))
}


/**
 *
 */
PaletteCommands.prototype.styleSmoothCommands_ = function (properties) {
  // TODO: check precondition (lineString, polygon)
  const update = this.layerStore_.commands.updateProperties.bind(this.layerStore_)
  const command = enabled => new Command({
    id: `style.smooth.${enabled}`,
    description: 'Style: Smooth - ' + (enabled ? 'Yes' : 'No'),
    body: () => {
      this.undo_.apply(update(properties, properties.map(properties => ({
        ...properties,
        style: {
          ...properties.style,
          smooth: enabled
        }
      }))))
    }
  })

  return [command(true), command(false)]
}
