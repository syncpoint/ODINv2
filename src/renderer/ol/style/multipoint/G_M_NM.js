import { styles } from '../styles'
import * as TS from '../../ts'

// MINIMUM SAFE DISTANCE ZONES
styles['MultiPoint:G*M*NM----'] = ({ styles, feature, points }) => {
  const [C, A] = TS.coordinates(points)
  const segment = TS.segment([C, A])
  const text = feature.get('t')

  return [
    styles.defaultStroke(TS.pointBuffer(TS.point(C))(segment.getLength())),
    text ? styles.outlinedText(TS.point(A), { text }) : []
  ]
}
