import * as R from 'ramda'
import { styles } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'
import { LineStringLabels } from '../labels'

// TASKS / FIX
styles['G*T*F-----'] = ({ feature, resolution }) => {
  const geometry = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()

    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [0.95, -0.04], [1, 0], [0.95, 0.04]
    ])

    const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
    const [p00, p01, p10, p11] = [
      ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
      ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
    ]

    const n = Math.floor(length / (resolution * 10))
    const x = R.flatten(R.zip(
      TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
      TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
    ))

    return TS.collect([
      TS.lineString([coords[0], p0]),
      TS.lineString([p0, ...x, p1]),
      TS.lineString([p1, coords[1]]),
      TS.lineString(xs)
    ])
  }))(feature.getGeometry())

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](feature.get('sidc')),
    labels: new LineStringLabels(feature.getGeometry(), feature.getProperties()),
    texts: styles['TEXTS:G*T*F-----']
  })
}
