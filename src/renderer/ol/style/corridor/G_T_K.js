import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { arrowCoordinates } from './commons'

// COUNTERATTACK (CATK)
styles['G*T*K-----'] = ({ styles, lineString, width, resolution }) => {
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(width, lineString)([
    [0, 0], [sx, sy], [sx, -sy], [sx, 0]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const linePoints = TS.coordinates([lineString])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const fontSize = `${width / resolution / 2}px`

  return [
    styles.defaultStroke(TS.difference([
      TS.union([buffer, arrow]).getBoundary(),
      TS.pointBuffer(TS.startPoint(lineString))(width / 2)
    ])),
    styles.label(TS.point(aps[3]), {
      fontSize,
      text: 'CATK',
      flip: true,
      textAlign: flipped => flipped ? 'end' : 'start',
      offsetX: flipped => flipped ? -10 : 10,
      rotation: Math.PI - lastSegment.angle()
    })
  ]
}
