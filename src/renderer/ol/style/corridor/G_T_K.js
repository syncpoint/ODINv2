import * as R from 'ramda'
import { styles, style, stroke } from '../styles'
import * as TS from '../ts'
import { arrowCoordinates } from './arrows'


// COUNTERATTACK (CATK)
styles['G*T*K-----'] = ({ feature, lineString, width, write, resolution }) => {
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(width, lineString)([
    [0, 0], [sx, sy], [sx, -sy], [sx, 0]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const linePoints = TS.coordinates([lineString])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const fontSize = `${width / resolution / 2}px`

  const geometries = write(TS.collect([
    TS.point(aps[3]),
    TS.difference([
      TS.union([buffer, arrow]).getBoundary(),
      TS.pointBuffer(TS.startPoint(lineString))(width / 2)
    ])
  ])).getGeometries()

  const solid = styles['STROKES:DASHED'](feature.get('sidc'))
  const textStyle = styles.TEXT({
    geometry: geometries[0],
    options: {
      text: 'CATK',
      flip: true,
      rotation: Math.PI - lastSegment.angle(),
      textAlign: flipped => flipped ? 'end' : 'start',
      offsetX: flipped => flipped ? -10 : 10,
      fontSize
    }
  })

  return [
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    textStyle
  ]
}
