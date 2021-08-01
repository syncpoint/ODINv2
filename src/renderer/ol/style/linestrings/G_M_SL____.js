import * as R from 'ramda'
import { styles, style, stroke } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'
import { smooth } from '../chaikin'

// FORTIFIED LINE
styles['G*M*SL----'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const width = resolution * 15
    const line = TS.lengthIndexedLine(geometry)
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

    return TS.collect(teeth)
  }))(smooth(feature.getGeometry()))

  return styles['STROKES:SOLID'](feature.get('sidc'))
    .map(options => style({
      geometry,
      stroke: stroke(options)
    }))
}
