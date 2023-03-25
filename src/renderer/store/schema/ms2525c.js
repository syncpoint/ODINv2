import * as L from '../../../shared/level'
import { index as ms2525c } from '../../symbology/2525c'

const upgrade = async (jsonDB) => {

  // Import symbols once for each fresh project database.
  // TODO: move to MigrationTool
  const id = symbol => `symbol:${symbol.sidc.substring(0, 10)}`
  const ops = Object.values(ms2525c).map(value => L.putOp(id(value), value))
  await jsonDB.batch(ops)
}

const downgrade = () => {}

export default {
  LOADED: upgrade,
  UNLOADED: downgrade
}
