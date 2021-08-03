import * as R from 'ramda'
import { styles, style, stroke, fill } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// OBSTACLE EFFECT / FIX
styles['G*M*OEF---'] = ({ feature, resolution }) => {
  const geometries = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const angle = segment.angle()
    const length = segment.getLength()

    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [1, 0], [0.9, -0.04], [0.9, 0], [0.9, 0.04], [1, 0]
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

    return [
      TS.collect([
        TS.lineString([coords[0], p0]),
        TS.lineString([p0, ...x, p1]),
        TS.lineString([p1, xs[2]])
      ]),
      TS.polygon(xs)
    ]
  }))(feature.getGeometry())

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const filled = styles['STROKES:FILLED'](feature.get('sidc'))

  return [
    ...solid.map(options => style({ geometry: geometries[0], stroke: stroke(options) })),
    ...filled.map(options => style({ geometry: geometries[1], stroke: stroke(options), fill: fill(options.fill) }))
  ]
}
