import { styles, style, stroke } from '../styles'
import * as TS from '../ts'
import { openArrow } from './arrows'

const withdrawLike = text => ({ feature, point, lineString, width, write, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()

  const [px] = TS.projectCoordinates(width / 4, angle, coords[0])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  const geometries = write(TS.collect([
    TS.point(segment.midPoint()),
    TS.collect([
      lineString,
      openArrow(resolution, angle, coords[1]),
      arc
    ])
  ])).getGeometries()

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const textStyle = styles.TEXT({
    geometry: geometries[0],
    options: {
      text,
      flip: true,
      rotation: Math.PI - angle
    }
  })

  return [
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    textStyle
  ]
}

styles['G*T*L-----'] = withdrawLike('D') // TASKS / CANALIZE
styles['G*T*M-----'] = withdrawLike('R') // TASKS / RETIREMENT
styles['G*T*W-----'] = withdrawLike('W') // TASKS / WITHDRAW
styles['G*T*WP----'] = withdrawLike('WP') // WITHDRAW UNDER PRESSURE
