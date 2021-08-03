import { styles, style, stroke } from '../styles'
import * as TS from '../ts'
import { openArrow } from './arrows'


// TASKS / CLEAR
styles['G*T*X-----'] = ({ feature, lineString, width, write, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p00, p01, p10, p11, p20, p21] = [
    ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 0.75], [0, -0.75]]),
    ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 0.75], [0, -0.75], [0, 1], [0, -1]])
  ]

  const arrows = [p10, coords[1], p11].map(coord => openArrow(resolution, angle, coord))
  const geometries = write(TS.collect([
    TS.point(segment.midPoint()),
    TS.collect([
      lineString,
      TS.lineString([p00, p10]),
      TS.lineString([p01, p11]),
      TS.lineString([p20, p21]),
      ...arrows
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
