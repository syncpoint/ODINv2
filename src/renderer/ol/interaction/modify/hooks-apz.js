import * as R from 'ramda'
import * as geom from 'ol/geom'
import { transform, getCoordinates } from '../../../model/geometry'
import * as TS from '../../ts'
import { PI_OVER_2 } from '../../../../shared/Math'

export default node => {
  const geometry = node.feature.getGeometry()
  const nodeGeometryType = node.geometry.getType()
  const { read, write } = transform(geometry)

  // Extract relevant geometry properties which define the geometry.
  const params = () => {
    const [baseline, taPoints, dzPoints] = TS.geometries(read(geometry))
    const dzCoordinate = TS.coordinates(dzPoints)

    // left of center, right of center
    const [x, y] = baseline.getCoordinates()
    const normal = TS.normalSegment(baseline)

    // clock-wise: near/left, far/left, far/right[, near/right]
    const [A, B, C] = TS.coordinates(taPoints)

    // center :: jts.geom.Coordinate
    const center = TS.midPoint(baseline)

    const angles = [
      TS.segment(x, B).angle() - normal.angle(),
      TS.segment(y, C).angle() - normal.angle()
    ]

    const params = { baseline, angles }

    // near/far border of target area (radii around baseline center)
    // near/far depth of danger zone 1 (distance to near/far border of target area)
    // width of danger zone 1 (distance to left bound of target area)
    // width of danger zone 2 (distance to left bound of target area)

    params.taNear = TS.segment(center, A).getLength()
    params.taFar = TS.segment(center, B).getLength()

    params.dz1NearDepth = params.taNear - TS.segment(center, dzCoordinate[0]).getLength()
    params.dz1FarDepth = TS.segment(center, dzCoordinate[1]).getLength() - params.taFar
    params.dz1Width = TS.distance(dzCoordinate[2], TS.segment(x, B))
    params.dz2Width = TS.distance(dzCoordinate[3], TS.segment(x, B))

    return params
  }

  const frame = (function create (params) {

    // Flip target area radii if necessary:
    if (params.taNear > params.taFar) {
      const radius = params.taNear
      params.taNear = params.taFar
      params.taFar = radius
    }

    // Flip angles if necessary:
    if (params.angles[0] - params.angles[1] < 0) {
      const angle = params.angles[0]
      params.angles[0] = params.angles[1]
      params.angles[1] = angle
    }

    const center = TS.midPoint(params.baseline)
    const [x, y] = TS.coordinates(params.baseline)
    const centerNormal = TS.normalSegment(params.baseline)
    const farB = TS.projectCoordinate(x)([centerNormal.angle() + params.angles[0], params.taFar * 10])
    const farC = TS.projectCoordinate(y)([centerNormal.angle() + params.angles[1], params.taFar * 10])
    const taLeft = TS.segment(x, farB)
    const taRight = TS.segment(y, farC)

    const taCoords = [
      TS.intersectCircle(center, params.taNear, taLeft),
      TS.intersectCircle(center, params.taFar, taLeft),
      TS.intersectCircle(center, params.taFar, taRight),
      TS.intersectCircle(center, params.taNear, taRight)
    ].flat()

    const taLeftMedian = TS.segment(taCoords[0], taCoords[1]).midPoint()
    const dangerZone1Depth = TS.projectCoordinateY(center, centerNormal.angle())
    const dangerZoneWidth = TS.projectCoordinateY(taLeftMedian, centerNormal.angle() + params.angles[0] + PI_OVER_2)
    const dz1Near = dangerZone1Depth(params.taNear - params.dz1NearDepth)
    const dz1Far = dangerZone1Depth(params.taFar + params.dz1FarDepth)
    const dz1Width = dangerZoneWidth(params.dz1Width)
    const dz2Width = dangerZoneWidth(params.dz2Width)

    const copy = properties => create({ ...params, ...properties })
    const coords = [...TS.coordinates(params.baseline), ...taCoords]

    const geometry = TS.collect([
      params.baseline,
      TS.multiPoint(taCoords),
      TS.multiPoint([dz1Near, dz1Far, dz1Width, dz2Width])
    ])

    const frame = { copy, coords, center, centerNormal }
    frame.baseline = params.baseline
    frame.angles = params.angles
    frame.geometry = write(geometry)
    frame.coordinates = getCoordinates(frame.geometry)

    return frame
  })(params())

  const baseline = {
    project: R.identity,
    coordinates: xs => {
      const baseline = read(new geom.LineString(xs))
      return frame.copy({ baseline }).coordinates
    }
  }

  const radius = coord => TS.segment(frame.center, coord).getLength()
  const leftAngle = coord => TS.segment(frame.coords[0], coord).angle() - frame.centerNormal.angle()
  const rightAngle = coord => TS.segment(frame.coords[1], coord).angle() - frame.centerNormal.angle()

  const nearLeft = {
    project: R.identity,
    coordinates: xs => {
      const coord = TS.coordinate(read(new geom.Point(xs[node.index])))
      const angles = [leftAngle(coord), frame.angles[1]]
      return frame.copy({ angles, taNear: radius(coord) }).coordinates
    }
  }

  const farLeft = {
    project: R.identity,
    coordinates: xs => {
      const coord = TS.coordinate(read(new geom.Point(xs[node.index])))
      const angles = [leftAngle(coord), frame.angles[1]]
      return frame.copy({ angles, taFar: radius(coord) }).coordinates
    }
  }

  const farRight = {
    project: R.identity,
    coordinates: xs => {
      const coord = TS.coordinate(read(new geom.Point(xs[node.index])))
      const angles = [frame.angles[0], rightAngle(coord)]
      return frame.copy({ angles, taFar: radius(coord) }).coordinates
    }
  }

  const nearRight = {
    project: R.identity,
    coordinates: xs => {
      const coord = TS.coordinate(read(new geom.Point(xs[node.index])))
      const angles = [frame.angles[0], rightAngle(coord)]
      return frame.copy({ angles, taNear: radius(coord) }).coordinates
    }
  }

  const handlers = {
    LineString: baseline,
    MultiPoint: [nearLeft, farLeft, farRight, nearRight]
  }

  const handler = nodeGeometryType === 'LineString'
    ? handlers[nodeGeometryType]
    : handlers[nodeGeometryType][node.index]

  return handler
}
