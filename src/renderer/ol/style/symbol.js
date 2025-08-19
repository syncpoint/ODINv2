import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { circuitBreaker } from '../../../shared/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
const modifierCache = new WeakMap()
const styleCache = new Map()

const computeModifiers = properties => {
  if (modifierCache.has(properties)) return modifierCache.get(properties)
  const modifiers = Object.entries(properties)
    .filter(([key, value]) => MODIFIERS[key] && value)
    .reduce((acc, [key, value]) => {
      acc[MODIFIERS[key]] = value
      return acc
    }, {})
  modifierCache.set(properties, modifiers)
  return modifiers
}

const getStyle = (sidc, modifiers) => {
  const key = `${sidc}-${JSON.stringify(modifiers)}`
  if (styleCache.has(key)) return styleCache.get(key)
  const style = [{
    id: 'style:2525c/symbol',
    'symbol-code': sidc,
    'symbol-modifiers': modifiers
  }]
  styleCache.set(key, style)
  return style
}

export default $ => {
  $.shape = Signal.link(
    (properties, show) => {
      const sidc = properties.sidc
      const modifiers = show ? computeModifiers(properties) : {}
      return getStyle(sidc, modifiers)
    },
    [$.properties, $.symbolPropertiesShowing]
  )

  $.selection = $.selectionMode.map(mode =>
    mode === 'multiselect'
      ? [{ id: 'style:rectangle-handle' }]
      : []
  )

  const combined = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.shape,
      $.selection
    ]
  )

  $.styles = circuitBreaker(combined).filter(Boolean)

  return $.styles
    .ap($.styleRegistry)
    .ap($.styleFactory)
}
