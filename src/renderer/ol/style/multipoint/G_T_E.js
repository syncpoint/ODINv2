import * as R from 'ramda'
import { styles } from '../styles'
import { deg2rad, quads, arcText } from './commons'
import * as TS from '../ts'

// TASKS / ISOLATE
styles['G*T*E-----'] = ({ styles, points, resolution }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const teeth = R.range(1, arcs[0].length)
    .filter(i => i % 5 === 0)
    .map(i => [arcs[0][i - 1], arcs[1][i], arcs[0][i + 1]])
    .map(coords => TS.lineString(coords))

  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arcs[0]))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arcs[0][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...teeth, TS.lineString(arcs[0])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    arcText(styles)(textAnchor, angle, 'I'),
    styles.defaultStroke(TS.union([geometry, TS.lineString(xs)]))
  ]
}