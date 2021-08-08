import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// LINEAR TARGET
styles['G*F*LT----'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      TS.lineString(R.props([0, 1], xs)),
      TS.lineString(R.props([2, 3], xs))
    ]))
  ]
}

styles['G*F*LTF---'] = styles['G*F*LT----'] // FINAL PROTECTIVE FIRE (FPF)
styles['G*F*LTS---'] = styles['G*F*LT----'] // LINEAR SMOKE TARGET
