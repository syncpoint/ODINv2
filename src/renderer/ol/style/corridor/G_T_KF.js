import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'
import { arrowCoordinates } from './commons'

// COUNTERATTACK BY FIRE
styles['G*T*KF----'] = ({ feature, lineString, width, resolution }) => {
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (48 / 26))
  if (arrowRatio < 1) throw new Error('segment too short')

  const aps = arrowCoordinates(width, lineString)([
    [28 / 26, 0], [48 / 26, 1], [48 / 26, -1], [48 / 26, 0],
    [37 / 26, 41 / 26], [15 / 26, 1], [15 / 26, -1], [37 / 26, -41 / 26],
    [15 / 26, 0], [5 / 26, 0],
    [0, 0], [5 / 26, 3 / 26], [5 / 26, -3 / 26]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const linePoints = TS.coordinates([lineString])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const fontSize = `${width / resolution / 2}px`

  return [
    styles.dashedStroke(TS.union([
      TS.difference([
        TS.union([buffer, arrow]).getBoundary(),
        TS.pointBuffer(TS.startPoint(lineString))(width / 2)
      ]),
      TS.lineString(R.props([4, 5, 6, 7], aps)),
      TS.lineString(R.props([8, 9], aps))
    ]))(feature),
    styles.filledStroke(TS.polygon(R.props([10, 11, 12, 10], aps)))(feature),
    styles.text({
      fontSize,
      text: 'CATK',
      flip: true,
      textAlign: flipped => flipped ? 'end' : 'start',
      offsetX: flipped => flipped ? -10 : 10,
      rotation: Math.PI - lastSegment.angle()
    }, TS.point(aps[3]))
  ]
}
