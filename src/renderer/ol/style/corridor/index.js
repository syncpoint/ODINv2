import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as MILSTD from '../../../2525c'
import * as TS from '../../ts'
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
  const handles = featureStyles.handles(new geom.MultiPoint([
    geometry.getGeometries()[1].getCoordinates(),
    ...geometry.getGeometries()[0].getCoordinates()
  ]))

  const tryer = () => transform(styles[key])({
    feature,
    resolution,
    styles: featureStyles
  })

  const catcher = err => {
    return transform(({ lineString, width }) => {
      // Get longest segment to place error message:
      const segments = TS.segments(lineString).sort((a, b) => b.getLength() - a.getLength())
      return [
        featureStyles.waspStroke(TS.lineBuffer(lineString)(width / 2)),
        featureStyles.outlinedText(TS.point(segments[0].midPoint()), {
          text: `invalid geometry\n${err.message}`.toUpperCase(),
          textFillColor: 'red',
          flip: true,
          textAlign: () => 'center',
          rotation: Math.PI - segments[0].angle()
        })
      ]
    })({ feature })
  }

  return [...R.tryCatch(tryer, catcher)(), ...handles]
}
