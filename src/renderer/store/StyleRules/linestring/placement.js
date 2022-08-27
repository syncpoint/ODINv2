import * as R from 'ramda'
import * as TS from '../../../ol/ts'

export default geometry => {
  const segments = TS.segments(geometry)
  const line = TS.lengthIndexedLine(geometry)
  const endIndex = line.getEndIndex()
  const coordAt = (fraction, offset = 0) => line.extractPoint(endIndex * fraction + offset)
  const pointAt = (fraction, offset = 0) => TS.point(coordAt(fraction, offset))
  const numPoints = geometry.getNumPoints()

  const segment = fraction => TS.segment([
    coordAt(fraction, -0.05),
    coordAt(fraction, +0.05)
  ])

  const angle = anchor => {
    if (!anchor) return segment(0.5).angle()
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return segment(0.5).angle()
      else if (anchor.includes('left')) return R.head(segments).angle()
      else if (anchor.includes('right')) return R.last(segments).angle()
    } else return segment(anchor).angle()
  }

  const anchors = anchor => {
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return pointAt(0.5)
      else if (anchor.includes('left')) return geometry.getPointN(0)
      else if (anchor.includes('right')) return geometry.getPointN(numPoints - 1)
      else return pointAt(0.5)
    } else return pointAt(anchor)
  }

  const normalize = angle => TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle)

  return props => {
    const anchor = props['text-anchor'] ||
      props['icon-anchor'] ||
      props['symbol-anchor'] ||
      (props['text-field'] ? 'center' : null)

    const rotate = angle(anchor)
    return {
      geometry: anchors(anchor),
      options: props['text-field']
        ? { ...props, 'text-rotate': normalize(rotate) }
        : { ...props, 'icon-rotate': normalize(rotate) }
    }
  }
}
