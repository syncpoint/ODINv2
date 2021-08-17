import { styles } from '../styles'
import * as TS from '../../ts'

// INFILTRATION LANE
styles['G*G*OLI---'] = ({ styles, lineString, width, feature }) => {
  const segments = TS.segments(lineString)
  const anchor = segments[0].pointAlong(0.5)

  return [
    styles.text(TS.point(anchor), {
      textAlign: () => 'center',
      rotation: Math.PI - segments[0].angle(),
      text: feature.get('t'),
      flip: true
    }),
    styles.solidStroke(TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.startPoint(lineString))(width / 2),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2)
    ]))
  ]
}
