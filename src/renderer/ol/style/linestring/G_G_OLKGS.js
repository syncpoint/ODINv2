import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// DIRECTION OF ATTACK / SUPPORTING ATTACK
styles['G*G*OLKGS-'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.86, -0.1], [1, 0], [0.86, 0.1]
  ])

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      TS.lineString(R.props([0, 1, 2], xs))
    ]))
  ]
}
