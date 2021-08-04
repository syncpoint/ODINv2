import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// FERRY
styles['G*M*BCF---'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const length = segment.getLength()
  const angle = segment.angle()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0], [0.08, -0.06], [0.08, 0], [0.08, 0.06],
    [1, 0], [0.92, -0.06], [0.92, 0], [0.92, 0.06]
  ])

  return [
    styles.solidStroke(TS.lineString([xs[2], xs[6]])),
    styles.filledStroke(TS.collect([
      TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
      TS.polygon(R.props([4, 5, 6, 7, 4], xs))
    ]))
  ]
}
