/* eslint-disable camelcase */
import * as R from 'ramda'
import shared from './shared'
import { MODIFIERS } from '../../symbology/2525c'

const rules = [...shared]
export default rules

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})


/**
 * symbolModifiers
 */
rules.push([next => {
  const { properties } = next
  return {
    symbolModifiers: modifiers(properties),
    symbolSpecification: null
  }
}, ['properties']])


/**
 * symbolSpecification
 */
rules.push([next => {
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
rules.push([next => {
  const { symbolSpecification, styleFactory, definingGeometry } = next
  const style = styleFactory({ geometry: definingGeometry, ...symbolSpecification })
  return { style }
}, ['symbolSpecification', 'styleFactory', 'definingGeometry']])
