import { styles, style, stroke } from '../styles'
import * as TS from '../ts'

// TASKS / BLOCK
styles['G*T*B-----'] = ({ feature, lineString, width, write }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const fractions = [[0, 1], [0, -1]]
  const geometries = write(TS.collect([
    TS.point(segment.midPoint()),
    TS.collect([
      lineString,
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
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
