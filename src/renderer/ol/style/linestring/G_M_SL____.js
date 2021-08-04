import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// FORTIFIED LINE
styles['G*M*SL----'] = ({ styles, resolution, lineString }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const teeth = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [
      a, b, c, d,
      TS.projectCoordinate(b)([angle + Math.PI / 2, width]),
      TS.projectCoordinate(c)([angle + Math.PI / 2, width])
    ])
    .map(([a, b, c, d, x, y]) => TS.lineString([a, b, x, y, c, d]))

  return styles.defaultStroke(TS.collect(teeth))
}
