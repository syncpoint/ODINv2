import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// RAFT SITE
styles['G*M*BCR---'] = ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()
    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [-0.09, -0.2], [0, 0], [-0.09, 0.2],
      [1.09, -0.2], [1, 0], [1.09, 0.2]
    ])

    return TS.collect([
      geometry,
      TS.lineString(R.props([0, 1, 2], xs)),
      TS.lineString(R.props([3, 4, 5], xs))
    ])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}
