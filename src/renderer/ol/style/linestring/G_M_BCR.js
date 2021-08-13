import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// RAFT SITE
styles['G*M*BCR---'] = ({ styles, lineString }) => {
  console.log('G*M*BCR---', lineString)
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.2], [0, 0], [-0.09, 0.2],
    [1.09, -0.2], [1, 0], [1.09, 0.2]
  ])

  return styles.defaultStroke(TS.collect([
    lineString,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ]))
}
