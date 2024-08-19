import * as R from 'ramda'
import * as ID from '../../ids'

// propStartsWith :: String -> String -> Object -> Boolean
const propStartsWith =
  name =>
    prefix =>
      R.compose(R.startsWith(prefix), R.prop(name))

// keyStartsWith :: String -> Object -> Boolean
const keyStartsWith = propStartsWith('key')

// isType :: String -> Object -> Boolean
const isType =
  type =>
    R.propEq(type, 'type')

// opMatches :: String -> String -> Object -> Boolean
const opMatches =
  (type, prefix) =>
    R.both(isType(type), keyStartsWith(prefix))

/**
 * ord :: Object -> Integer
 *
 * Batch operations order:
 *   0 - (del, style+), 1 - (del, feature),
 *   2 - (put, style+), 3 - (put, feature),
 *   4 - other
 */
const ord = R.cond([
  [opMatches('del', 'style+'), R.always(0)],
  [opMatches('del', ID.FEATURE_SCOPE), R.always(1)],
  [opMatches('put', 'style+'), R.always(2)],
  [opMatches('put', ID.FEATURE_SCOPE), R.always(3)],
  [R.T, R.always(4)]
])

export default ord
