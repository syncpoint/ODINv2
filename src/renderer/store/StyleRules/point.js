/* eslint-disable camelcase */
import * as R from 'ramda'
import { rules } from './rules'
import { MODIFIERS } from '../../symbology/2525c'

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

rules.Point = [...rules.shared]


/**
 * symbolModifiers
 */
rules.Point.push([next => {
  const { properties } = next
  return {
    symbolModifiers: modifiers(properties),
    symbolSpecification: null
  }
}, ['properties']])


/**
 * symbolSpecification
 */
rules.Point.push([next => {
  const { sidc, symbolModifiers } = next
  const symbolSpecification = {
    id: 'style:2525c/symbol',
    'symbol-code': sidc,
    'symbol-modifiers': symbolModifiers
  }

  return { symbolSpecification }
}, ['sidc', 'symbolModifiers']])


/**
 * style
 */
rules.Point.push([next => {
  const { symbolSpecification, styleFactory, definingGeometry } = next
  const style = styleFactory({ geometry: definingGeometry, ...symbolSpecification })
  return { style }
}, ['symbolSpecification', 'styleFactory', 'definingGeometry']])
