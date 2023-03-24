import * as ID from '../../ids'
import * as L from '../../../shared/level'

const upgrade = async jsonDB => {
  const tuples = await L.tuples(jsonDB, 'tags+layer:')
  const tags = tuples.find(([_, value]) => value.includes('default'))
  if (!tags) return

  const [key, value] = tags
  const id = ID.associatedId(key)

  const ops = [
    L.putOp(key, value.filter(tag => tag !== 'default')),
    L.putOp(ID.defaultId(id), true)
  ]

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  const keys = await L.keys(jsonDB, 'default+layer:')
  if (keys.length === 1) {
    const key = ID.dropScope(keys[0])
    const tags = await L.get(jsonDB, ID.tagsId(key))
    const ops = [
      L.delOp(keys[0]),
      L.putOp(ID.tagsId(key), [...tags, 'default'])
    ]

    await jsonDB.batch(ops)
  }
}

export default {
  SEPARATE: upgrade,
  TAGS: downgrade
}
