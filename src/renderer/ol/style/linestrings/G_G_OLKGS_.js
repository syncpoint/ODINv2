import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// DIRECTION OF ATTACK / SUPPORTING ATTACK
styles['G*G*OLKGS-'] = ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()
    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [0.86, -0.1], [1, 0], [0.86, 0.1]
    ])

    return TS.collect([
      geometry,
      TS.lineString(R.props([0, 1, 2], xs))
    ])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}
