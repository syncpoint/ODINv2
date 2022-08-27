import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import Point from './point'
import LineString from './linestring'
import Polygon from './polygon'
import Corridor from './corridor'

export const rules = {
  Point,
  LineString,
  Polygon,
  'LineString:Point': Corridor
}

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
    const merge = (acc, rule) => ({ ...acc, ...fn(rule)(next) })
    const isFulfilled = rule => deps(rule).every(key => !R.isNil(next[key]))
    const head = rules.find(rule => isFulfilled(rule) && !evaluated.includes(rule))
    if (!head) return next

    const tail = rules.filter(rule => rule !== head)
    evaluated.push(head)
    return evaluate(tail, merge(next, head))
  }

  const changed = Object.keys(facts).filter(different)
  if (changed.length === 0) return state

  const isOutdated = rule => deps(rule).some(key => changed.includes(key))
  const outdated = state.rules.filter(isOutdated)
  const next = { ...state, ...facts }
  const acc = evaluate(outdated, next)

  return R.isEmpty(acc) ? next : reduce(next, acc, evaluated)
}
