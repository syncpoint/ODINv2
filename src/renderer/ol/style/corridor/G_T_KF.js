import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { arrowCoordinates } from './commons'

// COUNTERATTACK BY FIRE
styles['LineString:Point:G*T*KF----'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (48 / 26))
  if (arrowRatio < 1) throw new Error('segment too short')

  const aps = arrowCoordinates(width, lineString)([
    [28 / 26, 0], [48 / 26, 1], [48 / 26, -1], [48 / 26, 0],
    [37 / 26, 41 / 26], [15 / 26, 1], [15 / 26, -1], [37 / 26, -41 / 26],
    [15 / 26, 0], [5 / 26, 0],
    [0, 0], [5 / 26, 3 / 26], [5 / 26, -3 / 26]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const linePoints = TS.coordinates([lineString])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const font = `${width / resolution / 2}px sans-serif`

  const path = TS.union([
    TS.difference([
      TS.union([buffer, arrow]).getBoundary(),
      TS.pointBuffer(TS.startPoint(lineString))(width / 2)
    ]),
    TS.lineString(R.props([4, 5, 6, 7], aps)),
    TS.lineString(R.props([8, 9], aps))
  ])

  return [
    { id: 'style:2525c/dashed-stroke', geometry: path },
    { id: 'style:2525c/solid-fill', geometry: TS.polygon(R.props([10, 11, 12, 10], aps)) },
    {
      id: 'style:default-text',
      geometry: TS.point(aps[3]),
      'text-field': '"CATK"',
      'text-font': font,
      'text-anchor': 'center',
      'text-justify': 'end',
      'text-padding': 5,
      'text-rotate': TS.rotation(lastSegment)
    }
  ]
}
