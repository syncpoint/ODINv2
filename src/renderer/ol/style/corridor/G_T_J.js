import * as R from 'ramda'
import { styles, style, stroke } from '../styles'
import * as TS from '../ts'
import { openArrow } from './arrows'


// TASKS / CONTAIN
styles['G*T*J-----'] = ({ feature, lineString, width, write, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

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

  const geometries = write(TS.collect([
    TS.point(p1),
    TS.collect([
      lineString,
      arcs[0],
      ...spikes,
      openArrow(resolution, angle, coords[1])
    ])
  ])).getGeometries()

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const textStyle = styles.TEXT({
    geometry: geometries[0],
    options: {
      text: 'C',
      flip: true,
      rotation: Math.PI - angle
    }
  })

  return [
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    textStyle
  ]
}
