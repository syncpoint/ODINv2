import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// MOVING CONVOY
styles['G*S*LCM---'] = ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const fractions = [[0, -0.1], [0.8, -0.1], [0.8, -0.16], [1, 0], [0.8, 0.16], [0.8, 0.1], [0, 0.1]]
    const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])(fractions)
    return TS.lineString(R.props([0, 1, 2, 3, 4, 5, 6, 0], xs))
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}
