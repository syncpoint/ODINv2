import { pipeline } from '../pipeline'
import { styles } from '../styles'
import './G_M_NM' // MINIMUM SAFE DISTANCE ZONES
import './G_T_E' // TASKS / ISOLATE
import './G_T_O' // TASKS / OCCUPY
import './G_T_Q' // TASKS / RETAIN
import './G_T_S' // TASKS / SECURE
import './G_T_Ux' // TASKS / SCREEN, GUARD, COVER and SEARCH AREA/RECONNAISSANCE AREA

styles['MultiPoint:DEFAULT'] = ({ geometry }) => [{ id: 'style:default', geometry }]

styles.MultiPoint = options => {
  return pipeline(styles, options)
}
