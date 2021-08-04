import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// ABATIS
styles['G*M*OS----'] = ({ feature, resolution, lineString }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const firstSegment = line.extractLine(0, width)
  const coords = TS.coordinates(firstSegment)
  const angle = TS.segment(TS.coordinates(firstSegment)).angle()
  const lastSegment = line.extractLine(width, line.getEndIndex())
  const a = R.head(coords)
  const b = TS.projectCoordinate(a)([angle + Math.PI / 3, width])
  const c = R.last(coords)
  const geometry = TS.lineString([a, b, c, ...TS.coordinates(lastSegment)])
  return styles.defaultStroke(geometry)(feature)
}
