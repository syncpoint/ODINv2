import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../../ts'
import { styles } from '../styles'

// OBSTACLE RESTRICTED AREA
styles['G*M*OGR---'] = ({ styles, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.read(new geom.LineString(coordinates[0]))
  const delta = resolution * 60

  const points = TS.segments(lineString)
    .map(segment => [segment, segment.getLength(), Math.floor(segment.getLength() / delta)])
    .map(([segment, length, n]) => [segment, length, n, (length - n * delta) / 2])
    .flatMap(([segment, length, n, offset]) => {
      const xs = R.range(0, n)
        .map(i => offset + i * delta)
        .flatMap(start => [start + delta / 4, start + delta / 2, start + delta * 3 / 4])
        .map(offset => offset / length)
        .map(fraction => segment.pointAlong(fraction))

      return [
        segment.getCoordinate(0),
        ...R.splitEvery(3, xs).flatMap(([a, b, c]) => [
          a,
          TS.projectCoordinate(b)([segment.angle() + Math.PI / 2, delta / 3]),
          c
        ]),
        segment.getCoordinate(1)
      ]
    })

  points.push(points[0])
  const fillPattern = { pattern: 'hatch', angle: 45, size: 2, spacing: 12 }
  return styles.defaultStroke(TS.write(TS.polygon(points)), { fillPattern })
}
