import * as MILSTD from '../../../2525c'
import { styles, makeStyles } from '../styles'
import { transform } from './commons'
import './G_M_NM' // MINIMUM SAFE DISTANCE ZONES
import './G_T_E' // TASKS / ISOLATE
import './G_T_O' // TASKS / OCCUPY
import './G_T_Q' // TASKS / RETAIN
import './G_T_S' // TASKS / SECURE
import './G_T_Ux' // TASKS / SCREEN, GUARD, COVER and // SEARCH AREA/RECONNAISSANCE AREA

styles.MultiPoint = ({ feature, resolution }) => {
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const featureStyles = makeStyles(feature)
  return styles[key]
    ? transform(styles[key])({
      feature,
      resolution,
      styles: featureStyles
    })
    : styles.DEFAULT()
}
