import * as R from 'ramda'
import { styles, style, stroke, fill } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

const teeth = (geometry, resolution) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const segmentPoints = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [a, a + width / 2, b - width / 2, b])

  return segmentPoints
    .map(([a, b, c, d]) => [
      line.extractPoint(a),
      TS.coordinates(line.extractLine(b, c)),
      line.extractPoint(d)
    ])
    .map(([a, coords, d]) => [a, coords, d, TS.segment([a, d]).angle()])
    .map(([a, coords, d, angle]) => [
      a,
      coords,
      d,
      TS.projectCoordinate(R.head(coords))([angle - Math.PI / 3, width]),
      TS.projectCoordinate(d)([angle - Math.PI / 2, width / 2])
    ])
    .flatMap(([a, coords, d, x, c]) => {
      return [
        TS.polygon([x, R.head(coords), R.last(coords), x]),
        TS.lineString([a, R.head(coords)]),
        TS.lineString([R.last(coords), d]),
        TS.pointBuffer(TS.point(c))(width / 3.5)
      ]
    })
}

// ANTITANK DITCH REINFORCED WITH ANTITANK MINES
styles['G*M*OAR---'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    return TS.collect(teeth(geometry, resolution))
  }))(feature.getGeometry())

  return styles['STROKES:FILLED'](feature.get('sidc'))
    .map(options => style({
      geometry,
      stroke: stroke(options),
      fill: fill(options.fill)
    }))
}

