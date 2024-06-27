import * as L from '../../../shared/level'

/**
 * Initially we stored ids not only in keys but often also redundantly in values.
 * It was convenient at first, but pretty soon it became just confusing.
 * The current approach is to store ids ONLY in keys and NEVER in values.
 */

const upgrade = async jsonDB => {
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .filter(([_, value]) => value.id)
    .map(([key, { id, ...value }]) => L.putOp(key, value))

  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  const tuples = await L.readTuples(jsonDB, '')
  const ops = tuples
    .map(([key, value]) => L.putOp(key, { ...value, id: key }))

  await jsonDB.batch(ops)
}

export default {
  'KEY-ONLY': upgrade,
  VALUE: downgrade
}
