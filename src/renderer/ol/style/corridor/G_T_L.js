import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

const withdrawLike = text => ({ styles, point, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()

  const [px] = TS.projectCoordinates(width / 4, angle, coords[0])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      openArrow(resolution, angle, coords[1]),
      arc
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text,
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

styles['G*T*L-----'] = withdrawLike('D') // TASKS / CANALIZE
styles['G*T*M-----'] = withdrawLike('R') // TASKS / RETIREMENT
styles['G*T*W-----'] = withdrawLike('W') // TASKS / WITHDRAW
styles['G*T*WP----'] = withdrawLike('WP') // WITHDRAW UNDER PRESSURE
