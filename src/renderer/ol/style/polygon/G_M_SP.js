import * as R from 'ramda'
import Polygon from 'ol/geom/Polygon'
import * as TS from '../../ts'
import { styles } from '../styles'

// STRONG POINT
styles['G*M*SP----'] = ({ styles, feature, resolution }) => {
  const geometry = feature.getGeometry()

  // TODO: 0f263f77-3e54-4930-8289-bb868882e48c - import: force polygon 'right hand rule'
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.lineString(TS.coordinates(TS.read(new Polygon(coordinates))))
  const indexedLine = TS.lengthIndexedLine(lineString)
  const endIndex = indexedLine.getEndIndex()
  const delta = resolution * 20
  const segmentPoints = R.aperture(2, R.range(0, 1 + Math.ceil(endIndex / delta)).map(i => i * delta))

  const spikes = TS.write(TS.collect(segmentPoints.map(([a, b]) => {
    const P1 = indexedLine.extractPoint((a + b) / 2)
    const [A, B] = [indexedLine.extractPoint(a), indexedLine.extractPoint(b)]
    const segment = TS.segment([A, B])
    const angle = segment.angle() - Math.PI / 2
    const P2 = TS.projectCoordinate(P1)([angle, delta * 0.75])
    return TS.lineString([P1, P2])
  })))

  return [
    styles.solidStroke(geometry),
    styles.solidStroke(spikes)
  ]
}
