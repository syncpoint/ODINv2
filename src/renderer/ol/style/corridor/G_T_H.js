import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// TASKS / BREACH
styles['G*T*H-----'] = ({ feature, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const rotation = Math.PI - angle
  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  const distance = resolution * 7

  const openCorridor = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  const anchor = TS.startPoint(lineString)
  const geometry = TS.collect([
    openCorridor,
    TS.lineString(R.props([0, 1], TS.projectCoordinates(distance, angle, p0)([[-1, 1], [1, -1]]))),
    TS.lineString(R.props([0, 1], TS.projectCoordinates(distance, angle, p1)([[-1, -1], [1, 1]])))
  ])

  return [
    styles.defaultStroke({}, geometry)(feature),
    styles.text({ text: 'C', flip: true, rotation }, anchor)
  ]
}