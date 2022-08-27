import * as TS from '../../../ol/ts'
import { lazy } from '../../../ol/style/lazy'

export default geometry => {
  const ring = geometry.getExteriorRing()
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)
  const [minX, maxX] = [envelope.getMinX(), envelope.getMaxX()]
  const [minY, maxY] = [envelope.getMinY(), envelope.getMaxY()]

  const xIntersection = lazy(() => {
    const coord = x => TS.coordinate(x, centroid.y)
    const axis = TS.lineString([minX, maxX].map(coord))
    return TS.intersection([geometry, axis]).getCoordinates()
  })

  const yIntersection = lazy(() => {
    const coord = y => TS.coordinate(centroid.x, y)
    const axis = TS.lineString([minY, maxY].map(coord))
    return TS.intersection([geometry, axis]).getCoordinates()
  })

  const fraction = factor => {
    const lengthIndexedLine = TS.lengthIndexedLine(ring)
    const length = lengthIndexedLine.getEndIndex()
    const coord = lengthIndexedLine.extractPoint(factor * length)
    return TS.point(coord)
  }

  const anchors = {
    center: lazy(() => TS.point(centroid)),
    bottom: lazy(() => TS.point(yIntersection()[0])),
    top: lazy(() => TS.point(yIntersection()[1])),
    left: lazy(() => TS.point(xIntersection()[0])),
    right: lazy(() => TS.point(xIntersection()[1]))
  }

  return props => {
    const anchor = props['text-anchor']
    const geometry = Number.isFinite(anchor)
      ? fraction(anchor)
      : anchors[anchor || 'center']()

    return {
      geometry,
      options: props
    }
  }
}
