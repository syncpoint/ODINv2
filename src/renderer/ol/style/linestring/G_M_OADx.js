import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

const teeth = (lineString, resolution) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const count = Math.floor(line.getEndIndex() / width)
  const offset = (line.getEndIndex() - count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + width * i))
    .map(([a, b]) => [line.extractPoint(a), line.extractPoint(b), line.extractLine(a, b)])
    .map(([a, b, line]) => [a, TS.segment([a, b]).angle(), TS.coordinates(line)])
    .map(([a, angle, coords]) => [TS.projectCoordinate(a)([angle + Math.PI / 3, width]), coords])
    .map(([c, coords]) => TS.polygon([c, ...coords, c]))
}

// ANTITANK DITCH / UNDER CONSTRUCTION
styles['LineString:G*M*OADU--'] = ({ styles, resolution, lineString }) => {
  return styles.solidStroke(TS.collect([
    lineString,
    ...teeth(lineString, resolution)])
  )
}

// ANTITANK DITCH / COMPLETE
styles['LineString:G*M*OADC--'] = ({ styles, resolution, lineString }) => {
  return styles.filledStroke(TS.collect([
    lineString,
    ...teeth(lineString, resolution)])
  )
}
