import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// DIRECTION OF ATTACK / MAIN ATTACK
styles['G*G*OLKGM-'] = ({ feature }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()
    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [0.86, -0.1], [1, 0], [0.86, 0.1], [0.86, 0.07], [0.965, 0], [0.86, -0.07]
    ])

    return TS.collect([
      TS.lineString([coords[0], xs[4]]),
      TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
    ])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc'))
  })
}