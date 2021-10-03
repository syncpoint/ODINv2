import * as R from 'ramda'
import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles } from '../styles'
import { transform } from '../../geometry'
import * as Clipping from '../clipping'
import './G_M_NM' // MINIMUM SAFE DISTANCE ZONES
import './G_T_E' // TASKS / ISOLATE
import './G_T_O' // TASKS / OCCUPY
import './G_T_Q' // TASKS / RETAIN
import './G_T_S' // TASKS / SECURE
import './G_T_Ux' // TASKS / SCREEN, GUARD, COVER and SEARCH AREA/RECONNAISSANCE AREA


styles['MultiPoint:DEFAULT'] = ({ geometry }) => [{ id: 'style:default', geometry }]

styles.MultiPoint = ({ feature, resolution, mode }) => {
  const { read, write } = transform(feature.getGeometry())
  const geometry = read(feature.getGeometry())
  const sidc = feature.get('sidc')
  const key = parameterized(sidc) || 'DEFAULT'

  const writeGeometry = option => ({ ...option, geometry: write(option.geometry) })
  const styleFactory = makeStyles(feature, mode)

  const pipeline = R.compose(
    options => options.map(styleFactory.makeStyle),
    options => options.map(writeGeometry),
    Clipping.clipLabels(resolution),
    options => options.map(styleFactory.evalTextField),
    styles[`MultiPoint:${key}`] || styles['MultiPoint:DEFAULT']
  )

  return [
    ...pipeline({ resolution, geometry }),
    ...styleFactory.handles(write(geometry))
  ]
}
