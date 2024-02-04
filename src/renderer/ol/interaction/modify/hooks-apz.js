import * as R from 'ramda'
import * as geom from 'ol/geom'
import { transform, getCoordinates } from '../../../model/geometry'
import * as TS from '../../ts'

export default node => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)

  // Extract relevant geometry properties which define the geometry.
  const params = () => {
    const [x, y, A, B, C, D] = TS.coordinates(read(geometry))
    const baseline = TS.lineString([x, y])
    const indexedLine = TS.lengthIndexedLine(baseline)
    const center = indexedLine.extractPoint(0.5 * indexedLine.getEndIndex())

    // // left/right border of target area: left/right baseline point and angle
    const leftSegment = TS.segment(x, B)
    const rightSegment = TS.segment(y, C)
    const leftAngle = leftSegment.angle()
    const rightAngle = rightSegment.angle()

    // // front/back border of target area (radii around baseline center)
    const frontRadius = TS.segment(center, A).getLength()
    const backRadius = TS.segment(center, B).getLength()
    return { baseline, center, frontRadius, backRadius, leftAngle, rightAngle }
  }

  const frame = (function create (params) {
    const { baseline, center, frontRadius, backRadius, leftAngle, rightAngle } = params
    const [x, y] = TS.coordinates([baseline])
    const ring = TS.difference([
      TS.pointBuffer(TS.point(center))(backRadius),
      TS.pointBuffer(TS.point(center))(frontRadius)]
    )
    const leftBack = TS.projectCoordinate(x)([leftAngle, backRadius * 2])
    const rightBack = TS.projectCoordinate(y)([rightAngle, backRadius * 2])
    const leftBound = TS.lineString([x, leftBack])
    const rightBound = TS.lineString([y, rightBack])

    const intersections = [
      ...TS.coordinates(TS.intersection([leftBound, ring])),
      // maintain clockwise orientation:
      ...R.reverse(TS.coordinates(TS.intersection([rightBound, ring])))
    ]

    const copy = properties => create({ ...params, ...properties })
    const coords = [...TS.coordinates(baseline), ...intersections]
    const points = coords.map(TS.point)
    const geometry = write(TS.multiPoint(points))
    return { copy, coordinates: getCoordinates(geometry) }
  })(params())

  return {
    project: xs => {
      return R.identity(xs)
    },
    coordinates: xs => {
      return frame.copy({}).coordinates
    }

  }
}
