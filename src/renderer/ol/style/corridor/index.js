import * as MILSTD from '../../../2525c'
import { styles, makeStyles } from '../styles'
import { transform } from './commons'
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

styles['LineString:Point'] = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  if (!key || !styles[key]) return styles.DEFAULT()

  const featureStyles = makeStyles(feature, mode)
  const geometry = feature.getGeometry()
  const handles = featureStyles.handles(geometry.getGeometries()[0])

  const style = transform(styles[key])({
    feature,
    resolution,
    styles: featureStyles
  })

  return [...style, ...handles]
}
