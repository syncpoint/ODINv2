import * as L from '../../../shared/level'
import { REDUNDANT_IDENTIFIERS } from './schema'

export default async ({ schemaDB, jsonDB, options }) => {
  const actual = await L.get(schemaDB, REDUNDANT_IDENTIFIERS, true)
  const wanted = options[REDUNDANT_IDENTIFIERS]

  const upgrade = async () => {
    const tuples = await L.readTuples(jsonDB, '')
    const ops = tuples
      .filter(([_, value]) => value.id)
      .map(([key, { id, ...value }]) => L.putOp(key, value))

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(REDUNDANT_IDENTIFIERS, false)
  }

  if (actual && wanted === false) await upgrade()
}
