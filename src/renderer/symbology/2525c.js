import * as R from 'ramda'
import raw from './2525c.json'

/* eslint-disable no-unused-vars */
const SCHEMA = 0
const IDENTITY = 1 // a.k.a Standard Identity
const BATTLE_DIMENSION = 2
const STATUS = 3
const FUNCTION_ID = 4
const MODIFIER = 10
const MOBILITY = 10
const INSTALLATION = 10
const ECHELON = 11
/* eslint-enable no-unused-vars */

// E.g. 'GFGPOAO----****' (15) => 'G*G*OAO---' (10)
export const parameterized = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const schemaCode = sidc => sidc
  ? sidc[SCHEMA]
  : null

export const battleDimensionCode = sidc => sidc
  ? sidc[BATTLE_DIMENSION]
  : null

// Standard Identity (ex. Affiliation)
export const identityCode = sidc => sidc
  ? sidc[IDENTITY]
  : 'U'

// status or P - PRESENT
export const statusCode = sidc => sidc
  ? sidc[STATUS]
  : 'P'

export const functionIdCode = sidc => sidc
  ? sidc.substring(FUNCTION_ID, FUNCTION_ID + 6)
  : null

export const format = (sidc, options) => {
  if (!sidc) return null

  let formatted = sidc
  if (options.schema) formatted = options.schema + formatted.substring(SCHEMA + 1)
  if (options.identity) formatted = formatted.substring(0, IDENTITY) + options.identity + formatted.substring(IDENTITY + 1)
  if (options.battleDimension) formatted = formatted.substring(0, BATTLE_DIMENSION) + options.battleDimension + formatted.substring(BATTLE_DIMENSION + 1)
  if (options.status) formatted = formatted.substring(0, STATUS) + options.status + formatted.substring(STATUS + 1)
  if (options.echelon) formatted = formatted.substring(0, ECHELON) + options.echelon + formatted.substring(ECHELON + 1)
  if (options.functionId) formatted = formatted.substring(0, FUNCTION_ID) + options.functionId + formatted.substring(FUNCTION_ID + 6)
  return formatted
}

export const MODIFIERS = {
  aa: 'specialHeadquarters',
  ad: 'platformType',
  ae: 'equipmentTeardownTime',
  af: 'commonIdentifier',
  ah: 'headquartersElement',
  ao: 'engagementBar',
  ap: 'targetNumber',
  aq: 'guardedUnit',
  ar: 'specialDesignator',
  c: 'quantity', // also modifier R
  f: 'reinforcedReduced',
  j: 'evaluationRating',
  k: 'combatEffectiveness',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  n: 'hostile',
  p: 'iffSif',
  q: 'direction',
  r: 'quantity', // also modifier C
  t: 'uniqueDesignation',
  v: 'type',
  x: 'altitudeDepth',
  y: 'location',
  z: 'speed',
  w: 'dtg'
}

export const index = raw
  .filter(({ unsupported }) => !unsupported)
  .reduce((acc, descriptor) => {
    const sidc = parameterized(descriptor.sidc)
    const dimensions = descriptor.dimensions
      ? descriptor.dimensions.split(',').map(s => s.trim()).filter(R.identity)
      : []

    acc[sidc] = {
      parameterized: sidc,
      sidc: descriptor.sidc,
      hierarchy: descriptor.hierarchy,
      scope: descriptor.scope,
      dimensions,
      geometry: {
        type: descriptor.geometry,
        ...descriptor.parameters
      }
    }

    return acc
  }, {})

export const descriptor = sidc => {
  if (!sidc) return
  return index[parameterized(sidc)]
}

export const geometry = sidc => {
  if (!sidc) return
  const descriptor = index[parameterized(sidc)]
  return descriptor && descriptor.geometry
}

export const geometryType = sidc => {
  if (!sidc) return
  const descriptor = index[parameterized(sidc)]
  return descriptor && descriptor.geometry && descriptor.geometry.type
}
