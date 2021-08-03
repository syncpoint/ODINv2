import * as R from 'ramda'
import { styles, style, stroke, text } from '../styles'
import * as UTM from '../utm'
import * as TS from '../ts'
import { LineStringLabels } from '../labels'

// DIRECTION OF ATTACK FOR FEINT
styles['G*G*PF----'] = ({ feature }) => {
  const geometries = UTM.use(TS.use(geometry => {
    const coords = TS.coordinates(geometry)
    const segment = R.last(TS.segments(geometry))
    const angle = segment.angle()
    const length = segment.getLength()
    const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
      [0.8, 0.2], [1, 0], [0.8, -0.2], // dashed
      [0.8, -0.136], [0.94, 0], [0.8, 0.136] // solid
    ])

    return coords.length > 2
      ? [
          TS.lineString(R.props([0, 1, 2], xs)),
          TS.collect([
            TS.lineString(R.dropLast(1, coords)),
            TS.lineString(R.props([3, 4, 5], xs)),
            TS.lineString([coords[coords.length - 2], xs[4]])
          ])
        ]
      : [
          TS.lineString(R.props([0, 1, 2], xs)),
          TS.collect([
            TS.lineString(R.props([3, 4, 5], xs)),
            TS.lineString([coords[coords.length - 2], xs[4]])
          ])
        ]
  }))(feature.getGeometry())

  const solid = styles['STROKES:SOLID'](feature.get('sidc'))
  const dashed = styles['STROKES:DASHED'](feature.get('sidc'), { lineDash: [8, 8] })
  const lastSegment = R.last(geometries[1].getGeometries())
  const labels = new LineStringLabels(lastSegment, feature.getProperties())
  const texts = styles['TEXTS:G*G*PF----'].flat()
    .map(labels.label.bind(labels))
    .map(styles.TEXT)


  return [
    ...dashed.map(options => style({ geometry: geometries[0], stroke: stroke(options) })),
    ...solid.map(options => style({ geometry: geometries[1], stroke: stroke(options) })),
    ...texts
  ]
}
