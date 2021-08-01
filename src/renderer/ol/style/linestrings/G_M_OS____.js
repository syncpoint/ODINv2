import * as R from 'ramda'
import { styles, style, stroke } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// ABATIS
styles['G*M*OS----'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const width = resolution * 20
    const line = TS.lengthIndexedLine(geometry)
    const firstSegment = line.extractLine(0, width)
    const coords = TS.coordinates(firstSegment)
    const angle = TS.segment(TS.coordinates(firstSegment)).angle()
    const lastSegment = line.extractLine(width, line.getEndIndex())
    const a = R.head(coords)
    const b = TS.projectCoordinate(a)([angle + Math.PI / 3, width])
    const c = R.last(coords)
    return TS.lineString([a, b, c, ...TS.coordinates(lastSegment)])
  }))(feature.getGeometry())

  return styles['STROKES:SOLID'](feature.get('sidc'))
    .map(options => style({
      geometry,
      stroke: stroke(options)
    }))
}
