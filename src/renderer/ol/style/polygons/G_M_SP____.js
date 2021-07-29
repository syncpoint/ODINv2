import { styles } from '../styles'

// TACGRP.MOBSU.SU.STRGPT
// TACTICAL GRAPHICS /  MOBILITY/SURVIVABILITY / STRONG POINT

import * as R from 'ramda'
import Polygon from 'ol/geom/Polygon'
import * as Style from '../primitives'
import * as MILSTD from '../../../2525c'
import { smooth } from '../chaikin'
import styleSpecs from '../style-specs'
import * as TS from '../ts'

styles['G*M*SP----'] = args => {
  console.log('[STONG POINT]')
  const { feature, resolution, placement } = args
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  // const geometry = feature.getGeometry().simplify()
  const geometry = smooth(feature.getGeometry().simplify())

  // TODO: 0f263f77-3e54-4930-8289-bb868882e48c - import: force polygon 'right hand rule'
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
      placement,
      strokes,
      properties: feature.getProperties(),
      texts: styleSpecs[`TEXTS:${key}`] || []
    })
  ]
}
