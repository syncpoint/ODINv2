import * as L from '../../../shared/level'

const upgrade = async jsonDB => {
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .filter(([_, value]) => value.id)
    .map(([key, { id, ...value }]) => L.putOp(key, value))

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  // TODO: limit to scopes originally carrying ids in values
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .map(([key, value]) => L.putOp(key, { ...value, id: key }))

  await jsonDB.batch(ops)
}

export default {
  'KEY-ONLY': upgrade,
  VALUE: downgrade
}
