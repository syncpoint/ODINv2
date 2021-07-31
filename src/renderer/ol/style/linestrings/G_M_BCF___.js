import * as R from 'ramda'
import { styles, style, stroke, fill } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'

// FERRY
styles['G*M*BCF---'] = ({ feature }) => {
  const geometries = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const length = segment.getLength()
    const angle = segment.angle()

    const xs = TS.projectCoordinates(length, angle, coords[0])([
      [0, 0], [0.08, -0.06], [0.08, 0], [0.08, 0.06],
      [1, 0], [0.92, -0.06], [0.92, 0], [0.92, 0.06]
    ])

    return [
      TS.lineString([xs[2], xs[6]]),
      TS.collect([
        TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
        TS.polygon(R.props([4, 5, 6, 7, 4], xs))
      ])
    ]
  }))(feature.getGeometry())

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const filled = styles['STROKES:FILLED'](feature.get('sidc'))

  return [
    ...solid.map(options => style({ geometry: geometries[0], stroke: stroke(options) })),
    ...filled.map(options => style({ geometry: geometries[1], stroke: stroke(options), fill: fill(options.fill) }))
  ]
}
