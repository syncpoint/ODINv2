import * as R from 'ramda'
import * as MIL_STD from '../../shared/2525c'
import { Command } from '../commands/Command'


const TYPES = Object.entries(MIL_STD.index).map(([parameterized, descriptor]) => {
  return {
    parameterized,
    sidc: descriptor.sidc,
    geometry: descriptor.geometry.type,
    text: R.last(descriptor.hierarchy)
  }
})

const STANDARD_IDENTITIES = [
  { code: 'P', name: 'Pending' },
  { code: 'U', name: 'Unknown' },
  { code: 'F', name: 'Friend/Own' },
  { code: 'N', name: 'Neutral' },
  { code: 'H', name: 'Hostile/Enemy' },
  { code: 'A', name: 'Assumed Friend' },
  { code: 'S', name: 'Suspect' },
  { code: 'J', name: 'Joker' },
  { code: 'K', name: 'Faker' },
  { code: '-', name: 'None' }
]

const STATUS = [
  { code: 'A', name: 'Anticipated/Planned' },
  { code: 'P', name: 'Present (Unit only)' },
  { code: 'C', name: 'Present/Fully Capable' },
  { code: 'D', name: 'Present/Fully Damaged' },
  { code: 'X', name: 'Present/Fully Destroyed' },
  { code: 'F', name: 'Present/Full to Capacity' }
]

const ECHELON = [
  { code: '-', name: 'None' },
  { code: 'A', name: 'Team/Crew' },
  { code: 'B', name: 'Squad' },
  { code: 'C', name: 'Section' },
  { code: 'D', name: 'Platoon/Detachment' },
  { code: 'E', name: 'Company/Battery/Troop' },
  { code: 'F', name: 'Battalion/Squadron' },
  { code: 'G', name: 'Regiment/Group' },
  { code: 'H', name: 'Brigade' },
  { code: 'I', name: 'Division' },
  { code: 'J', name: 'Corps/MEF' },
  { code: 'K', name: 'Army' },
  { code: 'L', name: 'Army Group/Front' },
  { code: 'M', name: 'Region' },
  { code: 'N', name: 'Command' }
]

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
  entries.push(...this.identityCommands_(properties))
  entries.push(...this.statusCommands_(properties))
  entries.push(...this.echelonCommands_(properties))

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
      schema: MIL_STD.schemaCode(type.sidc),
      battleDimension: MIL_STD.battleDimensionCode(type.sidc),
      functionId: MIL_STD.functionIdCode(type.sidc)
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

  return TYPES
    .filter(type => type.geometry === geometries[0])
    .map(command)
}


/**
 * Standard Identity.
 */
PaletteCommands.prototype.identityCommands_ = function (properties) {
  if (Object.keys(properties).length === 0) return []

  const command = identity => {
    const newProperties = Object.entries(properties)
      .map(([id, properties]) => ({
        id,
        properties: {
          ...properties,
          sidc: MIL_STD.format(properties.sidc, { identity: identity.code })
        }
      }))

    return new Command({
      id: `identity:${identity.code}`,
      description: `Identity - ${identity.name}`,
      body: (dryRun) => this.updateProperties_(dryRun, properties, newProperties)
    })
  }

  return STANDARD_IDENTITIES.map(command)
}


/**
 * Status/Operational Condition.
 */
PaletteCommands.prototype.statusCommands_ = function (properties) {
  if (Object.keys(properties).length === 0) return []

  const command = status => {
    const newProperties = Object.entries(properties)
      .map(([id, properties]) => ({
        id,
        properties: {
          ...properties,
          sidc: MIL_STD.format(properties.sidc, { status: status.code })
        }
      }))

    return new Command({
      id: `status:${status.code}`,
      description: `Status/Condition - ${status.name}`,
      body: (dryRun) => this.updateProperties_(dryRun, properties, newProperties)
    })
  }

  return STATUS.map(command)
}

/**
 * Size/Echelon.
 */
PaletteCommands.prototype.echelonCommands_ = function (properties) {
  if (Object.keys(properties).length === 0) return []

  const command = echelon => {
    const newProperties = Object.entries(properties)
      .map(([id, properties]) => ({
        id,
        properties: {
          ...properties,
          sidc: MIL_STD.format(properties.sidc, { echelon: echelon.code })
        }
      }))

    return new Command({
      id: `size:${echelon.code}`,
      description: `Echelon/Size - ${echelon.name}`,
      body: (dryRun) => this.updateProperties_(dryRun, properties, newProperties)
    })
  }

  return ECHELON.map(command)
}


/**
 *
 */
PaletteCommands.prototype.styleSmoothCommands_ = function (properties) {
  if (Object.keys(properties).length === 0) return []
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
