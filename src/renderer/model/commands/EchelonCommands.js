import { isFeatureId } from '../../ids'
import { Command } from './Command'
import * as MILSTD from '../../symbology/2525c'

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
 *
 */
export default function EchelonCommands (options) {
  this.store = options.store
}

EchelonCommands.prototype.commands = function (tuples) {
  return [
    this.echelon(tuples)
  ]
}

EchelonCommands.prototype.echelon = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const command = echelon => {
    const updateEchelon = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, { echelon: echelon.code })
      }
    })

    const newValues = oldValues.map(updateEchelon)
    const body = dryRun => dryRun
      ? this.store.update(keys, newValues)
      : this.store.update(keys, newValues, oldValues)

    return new Command({
      id: `size:${echelon.code}`,
      description: `Echelon/Size - ${echelon.name}`,
      body,
      revert: () => this.store.update(keys, oldValues)
    })
  }

  return ECHELON.map(command)
}

