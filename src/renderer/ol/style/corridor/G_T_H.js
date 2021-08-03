import * as R from 'ramda'
import { styles, style, stroke } from '../styles'
import * as TS from '../ts'

// TASKS / BREACH
styles['G*T*H-----'] = ({ feature, lineString, width, write, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  const distance = resolution * 7

  const geometries = write(TS.collect([
    TS.startPoint(lineString),
    TS.collect([
      // Corridor boundary minus opening at line end:
      TS.difference([
        TS.boundary(TS.lineBuffer(lineString)(width / 2)),
        TS.pointBuffer(TS.endPoint(lineString))(width / 2)
      ]),
      TS.lineString(R.props([0, 1], TS.projectCoordinates(distance, angle, p0)([[-1, 1], [1, -1]]))),
      TS.lineString(R.props([0, 1], TS.projectCoordinates(distance, angle, p1)([[-1, -1], [1, 1]])))
    ])
  ])).getGeometries()

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const textStyle = styles.TEXT({
    geometry: geometries[0],
    options: {
      text: 'B',
      flip: true,
      rotation: Math.PI - angle
    }
  })

  return [
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    textStyle
  ]
}
