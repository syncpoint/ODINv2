import * as ID from '../../ids'
import * as L from '../../../shared/level'

const upgrade = async jsonDB => {
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .filter(([_, value]) => value.hidden || value.locked || value.shared)
    .reduce((acc, [key, { hidden, locked, shared, ...value }]) => {
      acc.push(L.putOp(key, value))
      if (hidden) acc.push(L.putOp(ID.hiddenId(key), true))
      if (locked) acc.push(L.putOp(ID.lockedId(key), true))
      if (shared) acc.push(L.putOp(ID.sharedId(key), true))
      return acc
    }, [])

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  const hidden = await L.keys(jsonDB, 'hidden+')
  const locked = await L.keys(jsonDB, 'locked+')
  const shared = await L.keys(jsonDB, 'shared+')
  const all = [].concat(hidden, locked, shared)

  const entities = all.reduce((acc, key) => {
    const [scope, id] = key.split('+')
    acc[id] = acc[id] || {}
    acc[id][scope] = true
    return acc
  }, {})

  const keys = Object.keys(entities)
  const tuples = await L.mgetTuples(jsonDB, keys)
  const kv = tuples.map(([k, v]) => [k, { ...v, ...entities[k] }])

  const ops = [
    ...all.map(L.delOp),
    ...kv.map(([k, v]) => L.putOp(k, v))
  ]

  await jsonDB.batch(ops)
}

export default {
  SEPARATE: upgrade,
  INLINE: downgrade
}
