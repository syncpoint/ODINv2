import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { fenceDoubleX, fenceLine } from './commons'

// DOUBLE FENCE
styles['LineString:G*M*OWD---'] = ({ styles, resolution, lineString }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 50)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return [
    fenceLine(lineString),
    ...R.range(1, n)
      .map(pointOptions)
      .map(fenceDoubleX)
  ]
}
