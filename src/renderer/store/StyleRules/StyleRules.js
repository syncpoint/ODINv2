import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import Point from './point'
import LineString from './linestring'
import Polygon from './polygon'
import Corridor from './corridor'
import MultiPoint from './multipoint'

export const rules = {
  Point,
  LineString,
  Polygon,
  'LineString:Point': Corridor,
  MultiPoint
}

const notEqual = (state, obj, key) => !isEqual(state[key], obj[key])

const comparators = {
  globalStyle: notEqual,
  layerStyle: notEqual,
  featureStyle: notEqual,
  properties: notEqual,
  modifiers: notEqual
}

const fn = rule => rule[0]
const deps = rule => rule[1]


/**
 *
 */
export const reduce = (state, facts, rank = 0) => {
  const next = { ...state, ...facts }
  const different = key => comparators[key]
    ? comparators[key](state, facts, key)
    : state[key] !== facts[key]

  if (rank >= state.rules.length) return next
  const changed = Object.keys(facts).filter(different)
  if (changed.length === 0) return state

  const isStale = rule => deps(rule).some(key => changed.includes(key))
  const isFulfilled = rule => deps(rule).every(key => !R.isNil(next[key]))
  const head = state.rules[rank]
  console.log(deps(head))
  const catcher = (err, next) => reduce(state, { ...next, err }, ++rank)
  const tryer = next => isStale(head) && isFulfilled(head)
    ? reduce(state, { ...next, ...fn(head)(next) }, ++rank)
    : reduce(state, next, ++rank)

  return R.tryCatch(tryer, catcher)(next)
}
