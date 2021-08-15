import * as R from 'ramda'
import raw from './2525c.json'

/* eslint-disable no-unused-vars */
const SCHEMA = 0
const STANDARD_IDENTITY = 1
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

export const schema = sidc => sidc
  ? sidc[SCHEMA]
  : null

export const battleDimension = sidc => sidc
  ? sidc[BATTLE_DIMENSION]
  : null

// Standard Identity (ex. Affiliation)
export const standardIdentity = sidc => sidc
  ? sidc[STANDARD_IDENTITY]
  : 'U'

// status or P - PRESENT
export const status = sidc => sidc
  ? sidc[STATUS]
  : 'P'

export const functionId = sidc => sidc
  ? sidc.substring(FUNCTION_ID, FUNCTION_ID + 6)
  : null

export const format = (sidc, options) => {
  if (!sidc) return null

  let formatted = sidc
  if (options.schema) formatted = options.schema + formatted.substring(SCHEMA + 1)
  if (options.battleDimension) formatted = formatted.substring(0, BATTLE_DIMENSION) + options.battleDimension + formatted.substring(BATTLE_DIMENSION + 1)
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

export const index = raw.reduce((acc, descriptor) => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    parameterized: sidc,
    sidc: descriptor.sidc,
    hierarchy: R.drop(1, descriptor.hierarchy),
    dimension: descriptor.dimension,
    scope: descriptor.scope,
    geometry: {
      type: descriptor.geometry,
      ...descriptor.parameters
    }
  }

  return acc
}, {})

export const geometry = sidc => {
  if (!sidc) return
  const feature = index[parameterized(sidc)]
  return feature && feature.geometry
}

export const geometryType = sidc => {
  if (!sidc) return
  const feature = index[parameterized(sidc)]
  return feature && feature.geometry && feature.geometry.type
}
