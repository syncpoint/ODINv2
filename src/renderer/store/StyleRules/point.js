/* eslint-disable camelcase */
import * as R from 'ramda'
import { rules } from './rules'
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
 * image
 */
rules.Point.push([next => {
  const { symbol } = next.style_factory
  const sidc = next.sidc
  const modifiers = next.symbol_modifiers
  const image = symbol(sidc, modifiers)
  return { image }
}, ['sidc', 'style_factory', 'symbol_modifiers']])


/**
 * style
 */
rules.Point.push([next => {
  const geometry_defining = next.geometry_defining
  const style_factory = next.style_factory
  const image = next.image
  const style = [style_factory.style({ geometry: geometry_defining, image })]
  return { style }
}, ['image', 'geometry_key', 'geometry_defining']])
