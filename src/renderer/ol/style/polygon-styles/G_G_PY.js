import * as R from 'ramda'

export default ({ TS, PI_OVER_2, geometry }) => {
  const ring = geometry.getExteriorRing()
  const line = TS.lengthIndexedLine(ring)
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)
  const [minX, maxX] = [envelope.getMinX(), envelope.getMaxX()]
  const [minY, maxY] = [envelope.getMinY(), envelope.getMaxY()]
  const length = Math.max(maxX - minX, maxY - minY)

  const PI_OVER_6 = PI_OVER_2 / 3

  const Xs = R.range(0, 12)
    .filter(i => i % 3 !== 0)
    .map(i => {
      const A = TS.projectCoordinate(centroid)([i * PI_OVER_6, length])
      const lineString = TS.lineString([centroid, A])
      const intersection = TS.intersection([geometry, lineString])
      const point = intersection.getPointN(1)
      const coord = TS.coordinate(point)
      const index = line.indexOf(coord)
      const segment = TS.segment(line.extractLine(index - 10, index + 10).getCoordinates())

      return {
        id: 'style:default-text',
        geometry: point,
        'text-field': '"X"',
        'text-padding': 5,
        'text-clipping': 'line',
        'text-rotate': TS.rotation(segment)
      }
    })

  return [
    { id: 'style:2525c/solid-stroke', geometry },
    ...Xs
  ]
}
