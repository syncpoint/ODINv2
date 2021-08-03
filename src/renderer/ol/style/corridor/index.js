import * as MILSTD from '../../../2525c'
import * as TS from '../ts'
import { styles } from '../styles'
import format from '../format'
import './G_T_B' // TASKS / BLOCK
import './G_T_C' // TASKS / CANALIZE
import './G_T_H' // TASKS / BREACH
import './G_T_J' // TASKS / CONTAIN
import './G_T_K' // COUNTERATTACK (CATK)
import './G_T_KF' // COUNTERATTACK BY FIRE
import './G_T_L' // TASKS / CANALIZE, RETIREMENT, WITHDRAW (UNDER PRESSURE)
import './G_T_P' // TASKS / PENETRATE
import './G_T_R' // TASKS / RELIEF IN PLACE (RIP)
import './G_T_T' // TASKS / DISRUPT
import './G_T_X' // TASKS / CLEAR
import './G_T_Y' // TASKS / BYPASS

styles['LineString:Point'] = args => {
  const { feature, geometry } = args

  const style = () => {
    const sidc = feature.get('sidc')
    const key = MILSTD.parameterized(sidc)
    if (!key) return styles.DEFAULT()

    const { read, write } = format(geometry)
    const [lineString, point] = TS.geometries(read(geometry))
    const width = 2 * TS.segment([TS.startPoint(lineString), point]
      .map(TS.coordinate)).getLength()

    return styles[key]
      ? styles[key]({ ...args, point, lineString, width, write })
      : styles.DEFAULT()
  }

  return style()
}
