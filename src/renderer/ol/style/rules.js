import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import Point from './point'
import LineString from './linestring'
import Polygon from './polygon'
import Corridor from './corridor'
import MultiPoint from './multipoint'
import Artillery from './artillery'

export const rules = {
  Point,
  LineString,
  Polygon,
  'LineString:Point': Corridor,
  MultiPoint,
  'LineString:Polygon': Artillery
}

const notEqual = (state, facts, key) => !isEqual(state[key], facts[key])

const comparators = {
  globalStyle: notEqual,
  layerStyle: notEqual,
  featureStyle: notEqual,
  properties: notEqual,
  modifiers: notEqual
}

/**
 * @param {int} rank corresponds to number of state.rule entries [0..n-1]
 */
export const reduce = (state, facts, rank = 0) => {
  const next = { ...state, ...facts }
  const different = key => comparators[key]
    ? comparators[key](state, facts, key)
    : state[key] !== facts[key]

  // All rules processed?
  const complete = rank >= state.rules.length
  if (complete) return next

  // Any changes properties?
  const changes = Object.keys(facts).filter(different)
  const unchanged = changes.length === 0
  if (unchanged) {
    console.warn('[style rule evaluation] premature end', rank)
    return state
  }

  // Changes include some dependency of given rule?
  const isStale = deps => deps.some(key => changes.includes(key))

  // All dependencies for given rule are available?
  const isFulfilled = deps => deps.every(key => !R.isNil(next[key]))

  const [fn, deps] = state.rules[rank]
  const evaluate = next => reduce(state, { ...next, ...fn(next) }, ++rank)
  const skip = next => reduce(state, next, ++rank)

  const tryer = next => isStale(deps) && isFulfilled(deps) ? evaluate(next) : skip(next)
  const catcher = (err, next) => reduce(state, { ...next, err }, ++rank)
  return R.tryCatch(tryer, catcher)(next)
}
