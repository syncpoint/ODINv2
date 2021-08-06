import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// FORWARD LINE OF OWN TROOPS (FLOT)
styles['G*G*GLF---'] = ({ styles, resolution, lineString }) => {
  const line = TS.lengthIndexedLine(lineString)
  const length = line.getEndIndex()
  const width = resolution * 15
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2
  const point = index => line.extractPoint(index)

  const segments = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α - Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α + Math.PI, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  return [
    styles.defaultStroke(TS.collect(segments))
  ]
}
