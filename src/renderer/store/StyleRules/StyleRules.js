import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import './shared'
import './point'
import './linestring'
import './polygon'
export { rules } from './rules'

const notDeepEqual = (state, obj, key) => !isEqual(state[key], obj[key])

const comparators = {
  style_default: notDeepEqual,
  style_layer: notDeepEqual,
  style_feature: notDeepEqual,
  style_effective: notDeepEqual,
  symbol_options: notDeepEqual,
  properties: notDeepEqual
}

/**
 *
 */
export const reduce = (state, obj) => {
  const different = key => comparators[key]
    ? comparators[key](state, obj, key)
    : state[key] !== obj[key]

  const changed = Object.keys(obj).filter(different)
  if (changed.length === 0) return state

  const next = { ...state, ...obj }
  const depends = rule => rule[1].some(key => changed.includes(key))
  const merger = (acc, rule) => ({ ...acc, ...rule[0](next) })
  const acc = state.rules.filter(depends).reduce(merger, {})
  return R.isEmpty(acc) ? next : reduce(next, acc)
}
