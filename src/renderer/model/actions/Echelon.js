import { createAction } from 'kbar'
import { isFeatureId } from '../../ids'
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
export default function Echelon (options) {
  this.store = options.store
}

Echelon.prototype.actions = function (tuples) {
  return [
    this.echelon(tuples)
  ]
}

Echelon.prototype.echelon = function (tuples) {
  const features = tuples.filter(([key]) => isFeatureId(key))
  if (features.length === 0) return []

  const keys = features.map(([key]) => key)
  const oldValues = features.map(([_, value]) => value)

  const action = echelon => {
    const updateEchelon = feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        sidc: MILSTD.format(feature.properties.sidc, { echelon: echelon.code })
      }
    })

    const newValues = oldValues.map(updateEchelon)

    return createAction({
      id: `size:${echelon.code}`,
      name: `Echelon/Size - ${echelon.name}`,
      perform: () => this.store.update(keys, newValues, oldValues),
      dryRun: () => this.store.update(keys, newValues)
    })
  }

  return ECHELON.map(action)
}

