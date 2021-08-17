import * as R from 'ramda'
import * as MIL_STD from '../2525c'
import { Command } from '../commands/Command'


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
export function PaletteCommands (layerStore, undo) {
  this.layerStore_ = layerStore
  this.undo_ = undo
}


/**
 *
 */
PaletteCommands.prototype.getCommands = function (properties) {
  const entries = []

  if (!properties) return entries

  entries.push(...this.typeCommands_(properties))
  entries.push(...this.styleSmoothCommands_(properties))

  entries.sort((a, b) => a.description().localeCompare(b.description()))
  return entries
}


/**
 *
 */
PaletteCommands.prototype.updateProperties_ = function (dryRun, properties, newProperties) {
  if (dryRun) {
    this.layerStore_.updateProperties(newProperties)
  } else {
    const oldProperties = Object.entries(properties).map(([id, properties]) => ({ id, properties }))
    const command = this.layerStore_.commands.updateProperties(oldProperties, newProperties)
    this.undo_.apply(command)
  }
}


/**
 *
 */
PaletteCommands.prototype.typeCommands_ = function (properties) {
  const geometryType = ([id, properties]) => MIL_STD.geometryType(properties.sidc)
  const geometries = R.uniq(Object.entries(properties).map(geometryType))
  if (geometries.length !== 1) return []

  const command = type => {
    const options = {
      schema: MIL_STD.schema(type.sidc),
      battleDimension: MIL_STD.battleDimension(type.sidc),
      functionId: MIL_STD.functionId(type.sidc)
    }

    const newProperties = Object.entries(properties)
      .map(([id, properties]) => ({
        id,
        properties: {
          ...properties,
          sidc: MIL_STD.format(properties.sidc, options)
        }
      }))

    return new Command({
      id: type.sidc,
      description: type.text,
      body: (dryRun) => this.updateProperties_(dryRun, properties, newProperties)
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

  const newProperties = enabled => Object.entries(properties)
    .map(([id, properties]) => ({
      id,
      properties: {
        ...properties,
        style: {
          ...properties.style,
          smooth: enabled
        }
      }
    }))

  const command = enabled => new Command({
    id: `style.smooth.${enabled}`,
    description: 'Style: Smooth - ' + (enabled ? 'Yes' : 'No'),
    body: (dryRun) => this.updateProperties_(dryRun, properties, newProperties(enabled))
  })

  return [command(true), command(false)]
}
