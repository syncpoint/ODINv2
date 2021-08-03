import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

const common = key => ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()
    const fractions = [[0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]]
    const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)

    return TS.collect([
      geometry,
      TS.lineString(R.props([0, 1], xs)),
      TS.lineString(R.props([2, 3], xs))
    ])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc')),
    texts: styles[key]
  })
}

styles['G*F*LT----'] = common('TEXTS:G*F*LT----') // LINEAR TARGET
styles['G*F*LTF---'] = common('TEXTS:G*F*LTF---') // FINAL PROTECTIVE FIRE (FPF)
styles['G*F*LTS---'] = common('TEXTS:G*F*LTS---') // LINEAR SMOKE TARGET
