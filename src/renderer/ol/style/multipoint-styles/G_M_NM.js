export default ({ TS, geometry }) => {
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  const path = TS.pointBuffer(TS.point(C))(segment.getLength())
  const anchor = TS.point(A)

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': 'modifiers.t',
      'text-padding': 10,
      'text-clipping': 'line'
    }
  ]
}
