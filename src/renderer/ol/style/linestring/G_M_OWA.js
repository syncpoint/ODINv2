import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { fenceX, fenceLine } from './commons'

// DOUBLE APRON FENCE
styles['LineString:G*M*OWA---'] = ({ resolution, geometry }) => {
  const lil = TS.lengthIndexedLine(geometry)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return [
    fenceLine(geometry),
    ...R.range(1, n).map(pointOptions).map(fenceX)
  ]
}
