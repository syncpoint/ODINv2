import * as R from 'ramda'
import { styles, style, stroke, fill } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

const teeth = (geometry, resolution) => {
  const width = resolution * 20
  const line = TS.lengthIndexedLine(geometry)
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
styles['G*M*OADU--'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    return TS.collect([geometry, ...teeth(geometry, resolution)])
  }))(feature.getGeometry())

  return styles['STROKES:SOLID'](feature.get('sidc'))
    .map(options => style({
      geometry,
      stroke: stroke(options)
    }))
}

// ANTITANK DITCH / COMPLETE
styles['G*M*OADC--'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    return TS.collect([geometry, ...teeth(geometry, resolution)])
  }))(feature.getGeometry())

  return styles['STROKES:FILLED'](feature.get('sidc'))
    .map(options => style({
      geometry,
      stroke: stroke(options),
      fill: fill(options.fill)
    }))
}
