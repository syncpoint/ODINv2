import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// ATTACK BY FIRE POSITION
styles['G*G*OAF---'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)

  const A = (() => {
    const project = TS.projectCoordinates(width / 2, segment.angle(), coords[0])
    const ps = project([[-0.25, 1.25], [0, 1], [0, -1], [-0.25, -1.25]])
    return TS.lineString(R.props([0, 1, 2, 3], ps))
  })()

  const B = (() => {
    const project = TS.projectCoordinates(resolution * 8, segment.angle(), coords[1])
    const ps = project([[-1, 0.75], [0, 0], [-1, -0.75]])
    return TS.lineString(R.props([0, 1, 2], ps))
  })()

  return styles.defaultStroke(TS.collect([lineString, A, B]))
}
