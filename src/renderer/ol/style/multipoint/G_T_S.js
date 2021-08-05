import * as R from 'ramda'
import { styles } from '../styles'
import { deg2rad, quads, arcText } from './commons'
import * as TS from '../ts'

// TASKS / SECURE
styles['G*T*S-----'] = ({ styles, points, resolution }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    arcText(styles)(textAnchor, angle, 'S'),
    styles.defaultStroke(TS.union([geometry, TS.lineString(xs)]))
  ]
}
