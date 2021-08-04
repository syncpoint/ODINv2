import { styles } from '../styles'
import * as TS from '../ts'
import { openArrow } from './commons'

// TASKS / RELIEF IN PLACE (RIP)
styles['G*T*R-----'] = ({ styles, point, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()

  const [px] = TS.projectCoordinates(width / 4, angle, coords[1])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  const geometry = TS.collect([
    lineString,
    TS.lineString([p1, p0]),
    openArrow(resolution, angle, coords[1]),
    openArrow(resolution, angle + Math.PI, p0),
    arc
  ])

  return [
    styles.defaultStroke(geometry),
    styles.text(TS.point(segment.midPoint()), {
      text: 'RIP',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}
