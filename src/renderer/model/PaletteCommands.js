import * as R from 'ramda'
import * as MILSTD from '../../shared/2525c'
import { Command } from '../commands/Command'


const TYPES = Object.entries(MILSTD.index).map(([parameterized, descriptor]) => {
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
PaletteCommands.prototype.getCommands = function (entries) {
  const commands = []

  if (!entries) return commands

  commands.push(...this.typeCommands_(entries))
  commands.push(...this.styleSmoothCommands_(entries))
  commands.push(...this.identityCommands_(entries))
  commands.push(...this.statusCommands_(entries))
  commands.push(...this.echelonCommands_(entries))

  commands.sort((a, b) => a.description().localeCompare(b.description()))
  return commands
}


/**
 *
 */
PaletteCommands.prototype.updateEntries_ = function (dryRun, entries, updatedEntries) {
  if (dryRun) {
    this.layerStore_.updateEntries(updatedEntries)
  } else {
    const command = this.layerStore_.commands.updateEntries(entries, updatedEntries)
    this.undo_.apply(command)
  }
}


/**
 *
 */
PaletteCommands.prototype.typeCommands_ = function (entries) {
  const geometryType = ({ properties }) => MILSTD.geometryType(properties.sidc)
  const geometries = R.uniq(entries.map(geometryType))
  if (geometries.length !== 1) return []

  const command = type => {
    const descriptor = MILSTD.descriptor(type.sidc)
    const options = {
      schema: MILSTD.schemaCode(type.sidc),
      battleDimension: MILSTD.battleDimensionCode(type.sidc),
      functionId: MILSTD.functionIdCode(type.sidc)
    }

    const updatedEntries = entries
      .map(entry => ({
        ...entry,
        hierarchy: descriptor.hierarchy || [],
        scope: descriptor.scope,
        dimensions: descriptor.dimensions,
        properties: {
          ...entry.properties,
          sidc: MILSTD.format(entry.properties.sidc, options)
        }
      }))

    return new Command({
      id: type.sidc,
      description: type.text,
      body: (dryRun) => this.updateEntries_(dryRun, entries, updatedEntries)
    })
  }

  return TYPES
    .filter(type => type.geometry === geometries[0])
    .map(command)
}


/**
 * Standard Identity.
 */
PaletteCommands.prototype.identityCommands_ = function (entries) {
  if (Object.keys(entries).length === 0) return []

  const command = identity => {
    const updatedEntries = entries
      .map(entry => {
        const sidc = MILSTD.format(entry.properties.sidc, { identity: identity.code })
        return {
          ...entry,
          identity: MILSTD.identityText(sidc),
          properties: {
            ...entry.properties,
            sidc
          }
        }
      })

    return new Command({
      id: `identity:${identity.code}`,
      description: `Identity - ${identity.name}`,
      body: (dryRun) => this.updateEntries_(dryRun, entries, updatedEntries)
    })
  }

  return STANDARD_IDENTITIES.map(command)
}


/**
 * Status/Operational Condition.
 */
PaletteCommands.prototype.statusCommands_ = function (entries) {
  if (Object.keys(entries).length === 0) return []

  const command = status => {
    const updatedEntries = entries
      .map(entry => ({
        ...entry,
        properties: {
          ...entry.properties,
          sidc: MILSTD.format(entry.properties.sidc, { status: status.code })
        }
      }))

    return new Command({
      id: `status:${status.code}`,
      description: `Status/Condition - ${status.name}`,
      body: (dryRun) => this.updateEntries_(dryRun, entries, updatedEntries)
    })
  }

  return STATUS.map(command)
}

/**
 * Size/Echelon.
 */
PaletteCommands.prototype.echelonCommands_ = function (entries) {
  if (Object.keys(entries).length === 0) return []

  const command = echelon => {
    const updatedProperties = entries
      .map(entry => {
        const sidc = MILSTD.format(entry.properties.sidc, { echelon: echelon.code })
        return {
          ...entry,
          properties: {
            ...entry.properties,
            sidc
          }
        }
      })

    return new Command({
      id: `size:${echelon.code}`,
      description: `Echelon/Size - ${echelon.name}`,
      body: (dryRun) => this.updateEntries_(dryRun, entries, updatedProperties)
    })
  }

  return ECHELON.map(command)
}


/**
 *
 */
PaletteCommands.prototype.styleSmoothCommands_ = function (entries) {
  if (Object.keys(entries).length === 0) return []
  // TODO: check precondition (lineString, polygon)

  const updatedEntries = enabled => entries
    .map(entry => ({
      ...entry,
      properties: {
        ...entry.properties,
        style: {
          ...entry.properties.style,
          smooth: enabled
        }
      }
    }))

  const command = enabled => new Command({
    id: `style.smooth.${enabled}`,
    description: 'Style: Smooth - ' + (enabled ? 'Yes' : 'No'),
    body: (dryRun) => this.updateEntries_(dryRun, entries, updatedEntries(enabled))
  })

  return [command(true), command(false)]
}
