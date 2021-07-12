import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'

const MODIFIERS = {
  aa: 'specialHeadquarters',
  ad: 'platformType',
  ae: 'equipmentTeardownTime',
  af: 'commonIdentifier',
  ah: 'headquartersElement',
  ac: 'country',
  ao: 'engagementBar',
  ap: 'targetNumber',
  aq: 'guardedUnit',
  c: 'quantity',
  f: 'reinforcedReduced',
  j: 'evaluationRating',
  k: 'combatEffectiveness',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  n: 'hostile',
  p: 'iffSif',
  q: 'direction',
  t: 'uniqueDesignation',
  v: 'type',
  x: 'altitudeDepth',
  y: 'location',
  z: 'speed',
  w: 'dtg'
}

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .filter(([key, value]) => {
    if (key === 't' && value === '[NO FORMALABBREVIATEDNAME]') return false
    if (key === 't' && value === 'Untitled') return false
    if (key === 'v' && value === 'Not otherwise specified') return false
    if (key === 'v' && value === 'Not Specified') return false
    return true
  })
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})


const icon = (properties, symbol) => {
  const anchor = [symbol.getAnchor().x, symbol.getAnchor().y]
  const size = symbol.getSize()
  const imgSize = [Math.floor(size.width), Math.floor(size.height)]
  const { q, rotate } = properties
  const rotation = rotate ? (q || 0) : 0

  return new Icon({
    anchor,
    imgSize,
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    img: symbol.asCanvas(),
    rotateWithView: true,
    rotation: rotation / 180 * Math.PI
  })
}

// Point geometry, aka symbol.
export const symbolStyle = (feature, options = {}) => {
  const { sidc, ...properties } = feature.getProperties()

  const symbol = new ms.Symbol(sidc, {
    // Note: infoFields (boolean) does not affect all modifiers (i.e. points/targets)
    size: 30,
    ...options.modifiers ? modifiers({ ...properties }) : {},
    outlineWidth: 4,
    outlineColor: 'white'
  })

  return symbol.isValid()
    ? new Style({ image: icon(properties, symbol) })
    : null
}
