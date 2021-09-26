import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { fenceO, fenceLine } from './commons'
import { PI_OVER_2 } from '../../../../shared/Math'

// DOUBLE STRAND CONCERTINA
styles['LineString:G*M*OWCD--'] = ({ styles, resolution, lineString }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const width = resolution * 7
  const segments = TS.segments(lineString)
  const startSegment = R.head(segments)
  const endSegment = R.last(segments)

  const startPoint = TS.projectCoordinate(
    TS.coordinate(TS.startPoint(lineString))
  )([startSegment.angle() + PI_OVER_2, width / 2])

  const endPoint = TS.projectCoordinate(
    TS.coordinate(TS.endPoint(lineString))
  )([endSegment.angle() + PI_OVER_2, width / 2])

  const buffer = TS.singleSidedLineBuffer(lineString)(width)
  const geometry = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.point(startPoint))(width / 2),
    TS.pointBuffer(TS.point(endPoint))(width / 2)
  ])

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fenceLine(geometry),
    ...R.range(1, n).map(pointOptions).map(fenceO)
  ]
}
