import * as L from '../../../shared/level'
import { symbols } from '../../symbology/2525c'

const upgrade = async (jsonDB) => {

  // Import symbols once for each fresh project database.
  const id = symbol => `symbol:${symbol.sidc.substring(0, 10)}`
  const ops = Object.values(symbols).map(value => L.putOp(id(value), value))
  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  // TODO: only delete 2525-C symbols.
  await L.mdel(jsonDB, 'symbol:')
}

export default {
  LOADED: upgrade,
  UNLOADED: downgrade
}
