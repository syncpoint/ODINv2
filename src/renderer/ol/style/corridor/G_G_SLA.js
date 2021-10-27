import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'
import { PI_OVER_2 } from '../../../../shared/Math'

// AMBUSH
styles['LineString:Point:G*G*SLA---'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const length = segment.getLength()
  const angle = segment.angle()
  const radius = Math.hypot(width, length)

  const C1 = TS.projectCoordinate(coords[0])([angle, -length])
  const C2 = TS.projectCoordinate(C1)([angle, -(radius - length)])
  const C = TS.lineString([C1, coords[1]])
  const [A1, A2] = TS.coordinates(TS.translate(angle - PI_OVER_2, C)(width))
  const [B1, B2] = TS.coordinates(TS.translate(angle + PI_OVER_2, C)(width))
  const rectangle = TS.polygon([A1, A2, B2, B1, A1])
  const circleA = TS.pointBuffer(TS.point(C1))(radius)
  const circleB = TS.pointBuffer(TS.point(C2))(radius)
  const circleDifference = TS.difference([circleA, circleB])

  const dy = resolution * 30
  const n = Math.floor(width / dy)
  const lines = R.range(0, n).reduce((acc, i) => {
    acc.push(TS.translate(angle - PI_OVER_2, C)((i + 1) * dy))
    acc.push(TS.translate(angle + PI_OVER_2, C)((i + 1) * dy))
    return acc
  }, [])

  const stencil = TS.intersection([circleDifference, rectangle])

  const path = TS.collect([
    lineString,
    TS.intersection([
      TS.difference([
        TS.boundary(circleDifference),
        circleB
      ]),
      rectangle
    ]),
    TS.intersection([TS.union(lines), stencil]),
    openArrow(resolution, angle, coords[1])
  ])

  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
