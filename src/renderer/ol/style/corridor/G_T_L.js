import { styles } from '../styles'
import * as TS from '../ts'
import { openArrow } from './commons'

const withdrawLike = text => ({ feature, point, lineString, width, resolution }) => {
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

  const geometry = TS.collect([
    lineString,
    openArrow(resolution, angle, coords[1]),
    arc
  ])

  return [
    styles.defaultStroke({}, geometry)(feature),
    styles.text({
      text,
      flip: true,
      rotation: Math.PI - angle
    }, TS.point(segment.midPoint()))
  ]
}

styles['G*T*L-----'] = withdrawLike('D') // TASKS / CANALIZE
styles['G*T*M-----'] = withdrawLike('R') // TASKS / RETIREMENT
styles['G*T*W-----'] = withdrawLike('W') // TASKS / WITHDRAW
styles['G*T*WP----'] = withdrawLike('WP') // WITHDRAW UNDER PRESSURE
