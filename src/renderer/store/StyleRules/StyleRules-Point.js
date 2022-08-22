/* eslint-disable camelcase */
import * as R from 'ramda'
import ms from 'milsymbol'
import { Style, Icon } from 'ol/style'
import { rules } from './StyleRules-Rules'
import { MODIFIERS } from '../../symbology/2525c'

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

rules.Point = [...rules.shared]


/**
 * symbol_modifiers
 */
rules.Point.push([next => {
  return { symbol_modifiers: modifiers(next.properties) }
}, ['properties']])


/**
 * symbol_options
 */
rules.Point.push([next => {
  if (!next.style_effective) return /* not quite yet */

  const modes = { dark: 'Dark', medium: 'Medium', light: 'Light' }
  const style_effective = next.style_effective
  const symbol_options = {
    ...next.symbol_modifiers,
    colorMode: modes[style_effective['color-scheme']],
    monoColor: style_effective['symbol-color'],
    fillOpacity: style_effective['symbol-fill-opacity'] || 1,
    outlineColor: style_effective['symbol-halo-color'],
    outlineWidth: style_effective['symbol-halo-width'],
    strokeWidth: style_effective['symbol-line-width'] || 3,
    infoColor: style_effective['symbol-text-color'],
    infoSize: style_effective['symbol-text-size'],
    size: style_effective['symbol-size'] || 100
  }

  return { symbol_options }
}, ['style_effective', 'symbol_modifiers']])


/**
 * symbol
 */
rules.Point.push([next => {
  const sidc = next.sidc
  const options = next.symbol_options
  const symbol = new ms.Symbol(sidc, { ...options })
  return { symbol }
}, ['symbol_options']])


/**
 * icon
 */
rules.Point.push([next => {
  const symbol = next.symbol
  const { width, height } = symbol.getSize()
  const style_effective = next.style_effective

  const icon = new Icon({
    anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
    imgSize: [Math.floor(width), Math.floor(height)],
    src: 'data:image/svg+xml;utf8,' + symbol.asSVG(),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    scale: style_effective['icon-scale'] || 0.3
  })

  return { icon }
}, ['symbol']])


/**
 * style
 */
rules.Point.push([next => {
  const icon = next.icon
  const geometry_defining = next.geometry_defining
  return { style: new Style({ geometry: geometry_defining, image: icon }) }
}, ['icon', 'geometry_key', 'geometry_defining']])
