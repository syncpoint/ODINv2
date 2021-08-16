import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../../ts'
import { styles } from '../styles'

// FORTIFIED AREA
styles['G*G*GAF---'] = ({ styles, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.read(new geom.LineString(coordinates[0]))
  const indexedLine = TS.lengthIndexedLine(lineString)
  const endIndex = indexedLine.getEndIndex()
  const delta = resolution * 20
  const segmentIndexes = R.aperture(2, R.range(0, 1 + Math.ceil(endIndex / delta)).map(i => i * delta))

  const points = segmentIndexes.reduce((acc, [a, b], index) => {
    const [A1, B1] = [indexedLine.extractPoint(a), indexedLine.extractPoint(b)]
    if (index % 2 === 0) {
      acc.push(A1, B1)
    } else {
      const segment = TS.segment([A1, B1])
      const angle = segment.angle() - Math.PI / 2
      const A2 = TS.projectCoordinate(A1)([angle, delta * 0.75])
      const B2 = TS.projectCoordinate(B1)([angle, delta * 0.75])
      acc.push(A2, B2)
    }

    return acc
  }, [])

  points.push(points[0])

  return styles.solidStroke(TS.write(TS.lineString(points)))
}
