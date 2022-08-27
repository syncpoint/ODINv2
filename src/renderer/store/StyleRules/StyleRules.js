import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import './shared'
import './generic'
import './point'
import './linestring/rules'
import './polygon'
export { rules } from './rules'

const notEqual = (state, obj, key) => !isEqual(state[key], obj[key])

const comparators = {
  globalStyle: notEqual,
  layerStyle: notEqual,
  featureStyle: notEqual,
  properties: notEqual
}

const fn = rule => rule[0]
const deps = rule => rule[1]


/**
 *
 */
export const reduce = (state, facts, evaluated = []) => {
  const different = key => comparators[key]
    ? comparators[key](state, facts, key)
    : state[key] !== facts[key]

  const evaluate = (rules, next) => {
    const pending = rules.filter(rule => !evaluated.includes(rule))
    const isFulfilled = rule => deps(rule).every(key => !R.isNil(next[key]))
    const [fulfilled, outdated] = R.partition(isFulfilled, pending)
    const merge = (acc, rule) => ({ ...acc, ...fn(rule)(next) })
    evaluated.push(...fulfilled)
    if (fulfilled.length === 0) return next
    else return evaluate(outdated, fulfilled.reduce(merge, next))
  }

  const changed = Object.keys(facts).filter(different)
  if (changed.length === 0) return state

  const isOutdated = rule => deps(rule).some(key => changed.includes(key))
  const outdated = state.rules.filter(isOutdated)
  const next = { ...state, ...facts }
  const acc = evaluate(outdated, next)

  return R.isEmpty(acc) ? next : reduce(next, acc, evaluated)
}
