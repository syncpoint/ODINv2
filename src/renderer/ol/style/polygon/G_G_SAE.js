import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../../ts'
import { styles } from '../styles'

// ENCIRCLEMENT
styles['G*G*SAE---'] = ({ styles, resolution, geometry }) => {
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
      const C = TS.projectCoordinate(segment.pointAlong(0.5))([angle, delta * 0.75])
      acc.push(C)
    }

    return acc
  }, [])

  points.push(points[0])
  const collection = TS.collect([TS.polygon(points), lineString])
  return styles.solidStroke(TS.write(collection))
}