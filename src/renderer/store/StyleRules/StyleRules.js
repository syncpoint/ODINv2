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

const fn = rule => rule[0]
const deps = rule => rule[1]

/**
 *
 */
export const reduce = (state, obj, pass = 1) => {
  const different = key => comparators[key]
    ? comparators[key](state, obj, key)
    : state[key] !== obj[key]

  const evaluate = (rules, next) => {
    const isFulfilled = rule => deps(rule).every(key => !R.isNil(next[key]))
    const [fulfilled, outdated] = R.partition(isFulfilled, rules)
    const merge = (acc, rule) => ({ ...acc, ...fn(rule)(next) })
    if (fulfilled.length === 0) return next
    else return evaluate(outdated, fulfilled.reduce(merge, next))
  }

  const changed = Object.keys(obj).filter(different)
  if (changed.length === 0) return state

  const isOutdated = rule => deps(rule).some(key => changed.includes(key))
  const outdated = state.rules.filter(isOutdated)
  const next = { ...state, ...obj }
  const acc = evaluate(outdated, next)

  return R.isEmpty(acc) ? next : reduce(next, acc, ++pass)
}
