import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// FOXHOLE, EMPLACEMENT OR WEAPON SITE
styles['G*M*SW----'] = ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()
    const fractions = [[0, 0.18], [0, 0], [1, 0], [1, 0.18]]
    const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)
    return TS.lineString(R.props([0, 1, 2, 3], xs))
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}
