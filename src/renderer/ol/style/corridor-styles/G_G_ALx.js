import * as R from 'ramda'

export default title => ({ TS, geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)

  const segments = R.aperture(2, coords)
    .map(points => TS.lineString(points))
    .map(line => TS.buffer({
      joinStyle: TS.BufferParameters.JOIN_ROUND,
      endCapStyle: TS.BufferParameters.CAP_ROUND
    })(line)(width))

  const label = ([point, rotation]) => ({
    id: 'style:default-text',
    'text-field': `t ? "${title} " + t : "${title}"`,
    'text-justify': 'center',
    'text-rotate': rotation,
    'text-clipping': 'none',
    geometry: TS.point(point)
  })

  const labels = R.aperture(2, TS.coordinates(lineString)).map(TS.segment)
    .filter(segment => segment.getLength() > resolution * 50)
    .map(segment => [segment.midPoint(), TS.rotation(segment)])
    .map(label)

  return [
    { id: 'style:2525c/solid-stroke', geometry: TS.collect(segments) },
    ...labels
  ]
}
