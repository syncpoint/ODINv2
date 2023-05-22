import * as R from 'ramda'
import * as ID from '../../ids'
import * as L from '../../../shared/level'

const upgrade = async jsonDB => {
  const tuples = await L.tuples(jsonDB, 'feature:')
  const ops = tuples
    .filter(([, value]) => value.properties?.style)
    .reduce((acc, [key, value]) => {
      const { style, ...properties } = value.properties
      acc.push(L.putOp(key, { ...value, properties }))
      acc.push(L.putOp(ID.styleId(key), style))
      return acc
    }, [])

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  const tuples = await L.tuples(jsonDB, 'style+feature:')
  const keys = tuples.map(([k]) => ID.dropScope(k))
  const styles = tuples.map(R.prop(1))
  const oldValues = await L.tuples(jsonDB, keys)

  const value = ({ properties, ...rest }, style) => ({
    ...rest,
    properties: {
      ...properties,
      style
    }
  })

  const newValues = R.zip(styles, oldValues).map(([style, [k, v]]) => [k, value(v, style)])
  const ops = [
    ...tuples.map(([k]) => L.delOp(k)),
    ...newValues.map(([k, v]) => L.putOp(k, v))
  ]

  await jsonDB.batch(ops)
}

export default {
  SEPARATE: upgrade,
  PROPERTIES: downgrade
}
