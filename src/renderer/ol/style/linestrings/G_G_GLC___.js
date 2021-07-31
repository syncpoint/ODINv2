import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// LINE OF CONTACT
styles['G*G*GLC---'] = ({ feature, resolution }) => {

  const geometry = UTM.use(TS.use(geometry => {
    const line = TS.lengthIndexedLine(geometry)
    const length = line.getEndIndex()
    const width = resolution * 20
    const n = Math.floor(length / width)
    const offset = (length - n * width) / 2
    const point = index => line.extractPoint(index)

    const segmentsA = R.range(0, n)
      .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
      .map(TS.segment)
      .map(s => [s.pointAlong(0.5), s.angle()])
      .map(([C, α]) => [TS.projectCoordinate(C)([α + Math.PI / 2, width / 2]), α])
      .map(([C, α]) => TS.arc(C, width / 2, α, Math.PI, 16))
      .map(coords => TS.lineString(coords))

    const segmentsB = R.range(0, n)
      .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
      .map(TS.segment)
      .map(s => [s.pointAlong(0.5), s.angle()])
      .map(([C, α]) => [TS.projectCoordinate(C)([α - Math.PI / 2, width / 2]), α])
      .map(([C, α]) => TS.arc(C, width / 2, α + Math.PI, Math.PI, 16))
      .map(coords => TS.lineString(coords))

    return TS.collect([...segmentsA, ...segmentsB])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}

