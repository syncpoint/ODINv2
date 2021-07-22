import * as R from 'ramda'
import Polygon from 'ol/geom/Polygon'
import * as Style from '../primitives'
import * as MILSTD from '../../../2525c'
import { smooth } from '../chaikin'
import styleSpecs from '../style-properties'
import * as TS from '../ts'

// TACGRP.MOBSU.SU.STRGPT
// TACTICAL GRAPHICS /  MOBILITY/SURVIVABILITY / STRONG POINT

export default args => {
  const { feature, resolution, positions } = args
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  // const geometry = feature.getGeometry().simplify()
  const geometry = smooth(feature.getGeometry().simplify())

  // TODO: force right hand rule on import, draw etc.
  const coordinates = geometry.getCoordinates(true)
  const lineString = TS.lineString(TS.coordinates(TS.read(new Polygon(coordinates))))
  const indexedLine = TS.lengthIndexedLine(lineString)
  const endIndex = indexedLine.getEndIndex()

  const delta = resolution * 20

  const segmentPoints = R.aperture(2, R.range(0, 1 + Math.ceil(endIndex / delta)).map(i => i * delta))
  const spikes = TS.write(TS.collect(segmentPoints.map(([a, b]) => {
    const P1 = indexedLine.extractPoint((a + b) / 2)
    const [A, B] = [indexedLine.extractPoint(a), indexedLine.extractPoint(b)]
    const segment = TS.segment([A, B])
    const angle = segment.angle() - Math.PI / 2
    const P2 = TS.projectCoordinate(P1)([angle, delta])
    return TS.lineString([P1, P2])
  })))

  const strokes = styleSpecs['STROKES:SOLID'](sidc)
  const spikesStyle = spikes
    ? strokes.map(options => Style.style({ geometry: spikes, stroke: Style.stroke(options) }))
    : []

  return [
    ...spikesStyle,
    ...Style.featureStyle({
      geometry,
      positions,
      strokes,
      properties: feature.getProperties(),
      texts: styleSpecs[`TEXTS:${key}`] || []
    })
  ]
}
