import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { MODIFIERS } from '../../2525c'


const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
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
    scale: 0.5,
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
    size: 60,
    ...options.modifiers ? modifiers(properties) : {},
    outlineWidth: 4,
    outlineColor: 'white'
  })

  return symbol.isValid()
    ? new Style({ image: icon(properties, symbol) })
    : null
}
