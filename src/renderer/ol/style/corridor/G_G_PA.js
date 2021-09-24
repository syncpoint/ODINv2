import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { arrowCoordinates } from './commons'

// AXIS OF ADVANCE FOR FEINT
styles['G*G*PA----'] = ({ styles, lineString, width, resolution, feature }) => {
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (30 / 26))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [30 / 26, 1]
  const aps = arrowCoordinates(width, lineString)([
    [10 / 26, 0], [sx, sy], [sx, -sy], [sx, 0],
    [23 / 26, sx], [0, 0], [23 / 26, -sx]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2)
  ])

  const linePoints = TS.coordinates([lineString])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const font = `${width / resolution / 2}px sans-serif`

  const uniqueDesignation = (() => {
    const t = feature.get('t')
    if (!t) return []
    return styles.label(TS.point(aps[3]), {
      font,
      textAlign: flipped => flipped ? 'end' : 'start',
      offsetX: flipped => flipped ? -10 : 10,
      rotation: Math.PI - lastSegment.angle(),
      text: t,
      flip: true
    })
  })()

  return [
    styles.solidStroke(corridor),
    styles.dashedStroke(TS.lineString(R.props([4, 5, 6], aps))),
    uniqueDesignation
  ]
}
