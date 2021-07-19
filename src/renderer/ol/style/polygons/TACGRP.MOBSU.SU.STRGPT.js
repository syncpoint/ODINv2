import * as R from 'ramda'
import * as Style from '../primitives'
import * as MILSTD from '../../../2525c'
import { smooth } from '../chaikin'
import styleSpecs from '../style-properties'
import * as TS from '../ts'

// TACTICAL GRAPHICS /  MOBILITY/SURVIVABILITY / STRONG POINT

export default args => {
  const { feature, resolution, positions } = args
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  // const geometry = feature.getGeometry().simplify()
  const geometry = smooth(feature.getGeometry().simplify())
  const sizeRatio = geometry.getArea() / (resolution * resolution)

  const lineString = TS.lineString(TS.coordinates(TS.read(geometry)))
  const indexedLine = TS.lengthIndexedLine(lineString)
  const endIndex = indexedLine.getEndIndex()
  const delta = resolution / endIndex * 55000

  const spikes = sizeRatio > 5
    ? TS.write(TS.collect(R.aperture(2, R.range(0, Math.ceil(endIndex / delta)).map(i => i * delta))
      .map(([a, b]) => {
        const P1 = indexedLine.extractPoint((a + b) / 2)
        const [A, B] = [indexedLine.extractPoint(a), indexedLine.extractPoint(b)]
        const segment = TS.segment([A, B])
        const angle = segment.angle() + Math.PI / 2
        const P2 = TS.projectCoordinate(P1)([angle, resolution * 20])
        return TS.lineString([P1, P2])
      })
    ))
    : null

  const strokes = styleSpecs['STROKES:SOLID'](sidc)
  const spikesStyle = spikes
    ? strokes.map(options => Style.style({ geometry: spikes, stroke: Style.stroke(options) }))
    : []

  return [
    ...spikesStyle,
    ...Style.featureStyle({
      geometry,
      sizeRatio,
      positions,
      strokes,
      properties: feature.getProperties(),
      texts: styleSpecs[`TEXTS:${key}`] || []
    })
  ]
}
