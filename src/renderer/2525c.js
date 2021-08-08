import * as R from 'ramda'
import descriptors from './2525c.json'

/* eslint-disable no-unused-vars */
const SCHEMA = 0
const STANDARD_IDENTITY = 1
const BATTLEDIMENSION = 2
const STATUS = 3
const MODIFIER = 10
const MOBILITY = 10
const INSTALLATION = 10
const ECHELON = 11
/* eslint-enable no-unused-vars */

// E.g. 'GFGPOAO----****' (15) => 'G*G*OAO---' (10)
export const parameterized = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

// Standard Identity (ex. Affiliation)
export const standardIdentity = sidc => sidc
  ? sidc[STANDARD_IDENTITY]
  : 'U'

// status or P - PRESENT
export const status = sidc => sidc
  ? sidc[STATUS]
  : 'P'

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

const index = descriptors.reduce((acc, descriptor) => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    sidc,
    hierarchy: R.drop(1, descriptor.hierarchy).join(', '),
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
