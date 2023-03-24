import * as R from 'ramda'
import * as ID from '../../ids'
import * as L from '../../../shared/level'

const upgrade = async jsonDB => {
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .filter(([_, value]) => value.tags)
    .reduce((acc, [key, { tags, ...value }]) => {
      acc.push(L.putOp(key, value))
      acc.push(L.putOp(ID.tagsId(key), tags))
      return acc
    }, [])

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  const tags = await L.tuples(jsonDB, 'tags+')
  const ids = tags.map(([k]) => ID.dropScope(k))
  const oldValues = await L.values(jsonDB, ids)
  const newValues = R.zip(tags, oldValues).map(([[_, tags], v]) => ({ ...v, tags }))
  await L.mput(jsonDB, R.zip(ids, newValues))
  await L.mdel(jsonDB, tags.map(R.prop(0)))
}

export default {
  SEPARATE: upgrade,
  INLINE: downgrade
}
