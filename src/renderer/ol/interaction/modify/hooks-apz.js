import * as R from 'ramda'
import * as geom from 'ol/geom'
import { point, circle, segment } from '@flatten-js/core'
import { transform, getCoordinates } from '../../../model/geometry'
import * as TS from '../../ts'

// midpoint :: jts.geom.LineString -> jts.geom.Coordinate
const midpoint = x => {
  const indexedLine = TS.lengthIndexedLine(x)
  return indexedLine.extractPoint(0.5 * indexedLine.getEndIndex())
}

export default node => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)

  // Extract relevant geometry properties which define the geometry.
  const params = () => {
    const [x, y, A, B, C, D] = TS.coordinates(read(geometry))
    const baseline = TS.lineString([x, y])
    const center = midpoint(baseline)

    // left/right border of target area:
    // left/right baseline point and angle
    const angles = [
      TS.segment(x, B).angle(),
      TS.segment(y, C).angle()
    ]

    // // front/back border of target area (radii around baseline center)
    const frontRadius = TS.segment(center, A).getLength()
    const backRadius = TS.segment(center, B).getLength()
    return { baseline, frontRadius, backRadius, angles }
  }

  const frame = (function create (params) {
    const { baseline, frontRadius, backRadius, angles } = params
    const center = midpoint(baseline)
    const [x, y] = TS.coordinates([baseline])
    const farB = TS.projectCoordinate(x)([angles[0], backRadius * 2])
    const farC = TS.projectCoordinate(y)([angles[1], backRadius * 2])
    const cb = circle(point(center.x, center.y), backRadius)
    const cf = circle(point(center.x, center.y), frontRadius)
    const ls = segment(x.x, x.y, farB.x, farB.y)
    const rs = segment(y.x, y.y, farC.x, farC.y)

    const intersections = [
      ...cf.intersect(ls),
      ...cb.intersect(ls),
      ...cb.intersect(rs),
      ...cf.intersect(rs)
    ].map(({ x, y }) => TS.coordinate([x, y]))

    const copy = properties => create({ ...params, ...properties })
    const coords = [...TS.coordinates(baseline), ...intersections]
    const points = coords.map(TS.point)
    const geometry = write(TS.multiPoint(points))
    return { copy, coords, coordinates: getCoordinates(geometry) }
  })(params())

  const baseline = {
    project: R.identity,
    coordinates: xs => {
      const currentCoords = R.take(2, frame.coords)
      const point = read(new geom.Point(xs[node.index]))
      currentCoords[node.index] = TS.coordinate(point)
      const baseline = TS.lineString(currentCoords)
      return frame.copy({ baseline }).coordinates
    }
  }

  const targetArea = {
    project: R.identity,
    coordinates: xs => {
      return frame.copy({}).coordinates
    }
  }

  const handlers = [
    baseline, baseline,
    targetArea, targetArea, targetArea, targetArea
  ]

  return handlers[node.index]
}
