import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// LINEAR TARGET
styles['LineString:G*F*LT----'] = ({ geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)

  const path = TS.collect([
    geometry,
    TS.lineString(R.props([0, 1], xs)),
    TS.lineString(R.props([2, 3], xs))
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path }
  ]
}

styles['LineString:G*F*LTF---'] = styles['LineString:G*F*LT----'] // FINAL PROTECTIVE FIRE (FPF)
styles['LineString:G*F*LTS---'] = styles['LineString:G*F*LT----'] // LINEAR SMOKE TARGET
