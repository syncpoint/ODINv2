import { styles, style, stroke } from '../styles'
import * as TS from '../ts'
import { openArrow } from './arrows'

// TASKS / PENETRATE
styles['G*T*P-----'] = ({ feature, lineString, width, write, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const geometries = write(TS.collect([
    TS.point(segment.midPoint()),
    TS.collect([
      lineString,
      openArrow(resolution, angle, coords[1]),
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
    ])
  ])).getGeometries()

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const textStyle = styles.TEXT({
    geometry: geometries[0],
    options: {
      text: 'P',
      flip: true,
      rotation: Math.PI - angle
    }
  })

  return [
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    textStyle
  ]
}
