import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'
import { openArrow } from './commons'


// TASKS / CONTAIN
styles['G*T*J-----'] = ({ feature, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const rotation = Math.PI - angle

  const cutout = TS.polygon(R.props([0, 1, 3, 2, 0], [
    ...TS.projectCoordinates(width, angle, coords[0])([[0, 1], [0, -1]]),
    ...TS.projectCoordinates(width, angle, coords[1])([[0, 1], [0, -1]])
  ]))

  const arcs = [width / 2, width / 2.5].map(radius => TS.difference([
    TS.boundary(TS.pointBuffer(TS.endPoint(lineString))(radius)),
    cutout
  ]))

  const spikes = R
    .zip(TS.coordinates(arcs[0]), TS.coordinates(arcs[1]))
    .map(coords => TS.lineString(coords))

  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[1, 0]])

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      arcs[0],
      ...spikes,
      openArrow(resolution, angle, coords[1])
    ]))(feature),
    styles.text({ text: 'C', flip: true, rotation }, TS.point(p1))
  ]
}
