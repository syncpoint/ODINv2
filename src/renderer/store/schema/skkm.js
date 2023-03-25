import * as L from '../../../shared/level'
import { symbols } from '../../symbology/skkm'

const upgrade = async (jsonDB) => {

  // Import symbols once for each fresh project database.
  const id = symbol => `symbol:${symbol.sidc.substring(0, 10)}`
  const ops = Object.values(symbols).map(value => L.putOp(id(value), value))
  await jsonDB.batch(ops)
}

const downgrade = async jsonDB => {
  // Only delete SKKM symbols:
  await L.mdel(jsonDB, 'symbol:K')
}

export default {
  LOADED: upgrade,
  UNLOADED: downgrade
}
