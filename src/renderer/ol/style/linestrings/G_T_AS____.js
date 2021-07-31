import * as R from 'ramda'
import { styles, style, stroke, fill } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'
import { LineStringLabels } from '../labels'

// FOLLOW AND SUPPORT
styles['G*T*AS----'] = ({ feature, resolution }) => {
  const geometries = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = TS.segment(coords)
    const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
      [0, 0], [-0.08, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08], [-0.08, 0.08],
      [0.82, -0.08], [1, 0], [0.82, 0.08], [0.82, 0]
    ])

    return [
      TS.collect([
        TS.lineString(R.props([3, 9], xs)),
        TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
      ]),
      TS.polygon(R.props([6, 7, 8, 6], xs))
    ]
  }))(feature.getGeometry())

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const filled = styles['STROKES:FILLED'](feature.get('sidc'))
  const labels = new LineStringLabels(feature.getGeometry(), feature.getProperties())
  const texts = styles['TEXTS:G*T*AS----']

  return [
    ...solid.map(options => style({ geometry: geometries[0], stroke: stroke(options) })),
    ...filled.map(options => style({ geometry: geometries[1], stroke: stroke(options), fill: fill(options.fill) })),
    ...texts.flat().map(text => labels.label(text)).filter(R.identity)
  ]
}
