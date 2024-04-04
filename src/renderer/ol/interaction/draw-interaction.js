import * as R from 'ramda'
import Draw from 'ol/interaction/Draw'
import uuid from 'uuid-random'
import * as MILSTD from '../../symbology/2525c'
import { writeFeatureObject } from '../../store/FeatureStore'
import * as TS from '../ts'
import * as EPSG from '../../epsg'
import { PI_OVER_2, PI_OVER_4, SQRT_2 } from '../../../shared/Math'

const GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle'
}

export default options => {
  const { services, map } = options
  const { emitter, store } = services

  const ORIGINATOR_ID = uuid()

  let pendingDraw = null
  let handlers = {}

  const cancel = () => {
    if (!pendingDraw) return
    Object.entries(handlers).forEach(([event, handler]) => {
      pendingDraw.un(event, handler)
    })

    handlers = {}
    map.removeInteraction(pendingDraw)
    pendingDraw = null
  }

  const drawstart = descriptor => ({ feature }) => {
    const sidc = MILSTD.format(descriptor.sidc, {
      identity: 'F', // FRIENDLY
      status: 'P' // PRESENT
    })

    feature.set('sidc', sidc)
  }

  const drawend = geometry => ({ feature }) => {
    // NOTE: side-effect may modify feature/geometry
    (geometry.complete || (() => {}))(map, feature)
    const geoJSON = writeFeatureObject(feature)
    store.insertGeoJSON([geoJSON])
    cancel()
  }

  emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) { cancel() }
  })

  emitter.on('command/entry/draw', ({ id }) => {
    // Cancel current draw unconditionally:
    cancel()
    emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    const sidc = id.split(':')[1]
    const descriptor = MILSTD.descriptor(sidc)
    if (!descriptor) return

    const geometry = geometries.find(geometry => geometry.match(descriptor))
    if (!geometry) return

    const options = geometry.options(descriptor)

    handlers = {
      drawabort: cancel,
      drawstart: drawstart(descriptor),
      drawend: drawend(geometry)
    }

    pendingDraw = new Draw(options)

    Object.entries(handlers).forEach(([event, handler]) => {
      pendingDraw.on(event, handler)
    })

    map.addInteraction(pendingDraw)
    map.getTargetElement().focus()
  })
}

const goldenRatio = 1.618033

const format = feature => {
  const code = EPSG.codeUTM(feature)
  const toUTM = geometry => EPSG.toUTM(code, geometry)
  const fromUTM = geometry => EPSG.fromUTM(code, geometry)
  const read = R.compose(TS.read, toUTM)
  const write = R.compose(fromUTM, TS.write)
  return { read, write }
}


/**
 * Geometry-specific options for Draw interaction.
 * Each option object provides:
 *    match :: FeatureDescriptor -> boolean - whether this option applies to feature descriptor
 *    options :: FeatureDescriptor -> (string ~> any) - actual options passed to interaction
 *    complete :: (ol/Map, ol/Feature) -> unit - optionally rewrite feature's geometry
 */
const geometries = [

  /* Point. */
  {
    match: ({ geometry }) => geometry.type === GeometryType.POINT,
    options: () => ({ type: GeometryType.POINT })
  },

  /* Polygon. */
  {
    match: ({ geometry }) => geometry.type === GeometryType.POLYGON && !geometry.layout,
    options: () => ({ type: GeometryType.POLYGON }),
    complete: (_, feature) => {
      const geometry = feature.getGeometry()
      const right = true
      geometry.setCoordinates(geometry.getCoordinates(right))
    }
  },

  /* LineString. */
  {
    match: ({ geometry }) => geometry.type === GeometryType.LINE_STRING,
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.geometry.maxPoints })
  },

  /* GeometryCollection/orbit. */
  {
    match: ({ geometry }) => geometry.layout === 'orbit',
    options: () => ({ type: GeometryType.LINE_STRING, maxPoints: 2 }),
    complete: (_, feature) => {
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const line = read(geometry)
      const coordinates = TS.coordinates(line)
      const segment = TS.segment(coordinates)
      const angle = segment.angle() + PI_OVER_2
      const distance = segment.getLength() / goldenRatio

      const C = TS.projectCoordinate(coordinates[0])([angle, distance])
      feature.setGeometry(write(TS.collect([line, TS.point(C)])))
    }
  },

  /* MultiPoint/fan (3-point) */
  {
    match: ({ geometry }) => geometry.layout === 'fan' &&
      Number.parseInt(geometry.maxPoints) === 3,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const distance = resolution * 50
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const point = read(geometry)

      const C = TS.coordinate(point)
      const A = TS.projectCoordinate(C)([0, distance])
      const B = TS.projectCoordinate(C)([PI_OVER_4, distance])
      feature.setGeometry(write(TS.multiPoint([C, A, B].map(TS.point))))
    }
  },

  /* MultiPoint/fan (2-point), including circular */
  {
    match: ({ geometry }) => geometry.layout === 'fan' &&
      Number.parseInt(geometry.maxPoints) === 2,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const radius = resolution * 50
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const point = read(geometry)

      const C = TS.coordinate(point)
      const A = TS.projectCoordinate(C)([0, radius])
      feature.setGeometry(write(TS.multiPoint([C, A].map(TS.point))))
      feature.set('am', `${Math.floor(radius)}`)
    }
  },

  /* MultiPoint/circle (2-point) */
  {
    match: ({ geometry }) => geometry.layout === 'circle' &&
      Number.parseInt(geometry.maxPoints) === 2,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const radius = resolution * 50
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const point = read(geometry)

      const C = TS.coordinate(point)
      const A = TS.projectCoordinate(C)([0, radius])
      feature.setGeometry(write(TS.multiPoint([C, A].map(TS.point))))
      feature.set('am', `${Math.floor(radius)}`)
    }
  },

  /* Polygon/rectangle */
  {
    match: ({ geometry }) => geometry.layout === 'rectangle',
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const distance = resolution * 50
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const point = read(geometry)

      const A = TS.coordinate(point)
      const C = TS.projectCoordinate(A)([-PI_OVER_4, distance * SQRT_2])
      const B = TS.coordinate([C.getX(), A.getY()])
      const D = TS.coordinate([A.getX(), C.getY()])
      feature.setGeometry(write(TS.polygon([A, B, C, D, A])))
    }
  },

  /* GeometryCollection/corridor (2-/n-point) */
  {
    match: ({ geometry }) => geometry.layout === 'corridor',
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.geometry.maxPoints }),
    complete: (map, feature) => {
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const line = read(geometry)
      const min = (a, b) => Math.min(a, b)
      const segments = TS.segments(line)
      const minLength = segments.map(segment => segment.getLength()).reduce(min)
      const width = Math.min(minLength / 2, map.getView().getResolution() * 50)
      const A = TS.coordinate(TS.startPoint(line))
      const angle = segments[0].angle() - PI_OVER_2
      const point = TS.point(TS.projectCoordinate(A)([angle, width / 2]))
      feature.setGeometry(write(TS.collect([line, point])))
    }
  },

  /* SUPPORT BY FIRE POSITION */
  {
    match: ({ geometry }) => geometry.layout === 'beam-2' &&
      Number.parseInt(geometry.minPoints) === 2 &&
      Number.parseInt(geometry.maxPoints) === 4,
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.geometry.minPoints }),
    complete: (map, feature) => {
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const line = read(geometry)
      const segments = TS.segments(line)
      const angle = segments[0].angle()
      const length = segments[0].getLength()

      const [A, B] = TS.coordinates(line)
      const PI_OVER_8 = PI_OVER_4 / 2
      const C = TS.projectCoordinate(A)([angle + PI_OVER_2 + (PI_OVER_8), length / 2])
      const D = TS.projectCoordinate(B)([angle + PI_OVER_2 - (PI_OVER_8), length / 2])
      feature.setGeometry(write(TS.multiPoint([A, B, C, D].map(TS.point))))
    }
  },

  /* GeometryCollection - Artillery Position Zones (APZ) */
  {
    match: ({ geometry }) => geometry.layout === 'apz',
    options: () => ({ type: GeometryType.LINE_STRING, maxPoints: 2 }),
    complete: (map, feature) => {

      // Construct geometry from 2-point line (baseline center to target area center):
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const centerLine = read(geometry) // in UTM
      const centerCoords = TS.coordinates(centerLine)
      const centerSegment = TS.segment(centerCoords)
      const length = centerSegment.getLength()

      // Defining geometry collection contains the following information:
      // A. Baseline :: 2-Point LineString
      // B. Target Area :: 4-Point MultiPoint (near/left, far/left, far/right, near/right)
      // C. 4-Point MultiPoint
      //   D. Danger Zone 1 near depth :: Point (on center line)
      //   E. Danger Zone 1 far depth :: Point (on center line)
      //   F. Danger Zone 1 width :: Point (orthogonal to left target area bounds median)
      //   G. Danger Zone 2 width :: Point (orthogonal to left target area bounds median)

      // Upon construction, centerline defines the complete initial geometry:
      // - Baseline length: 1/6 of centerline length
      // - Target Area width: 1/2 of centerline length (width at the far end, not center)
      // - Target Area near radius: 75% of centerline length
      // - Target Area far radius: 125% of centerline length
      // - Danger Zone 1 near radius: Target Area near radius - 20 % of centerline length
      // - Danger Zone 1 far radius: Target Area far radius + 25 % of centerline length
      // - Danger Zone 1 width: 10 % of centerline length
      // - Danger Zone 2 width: 10 % of centerline length

      // A. Baseline
      // Project centerline start point to the left and right.

      const baselineLength = length / 6
      const baselineCoords = TS.projectCoordinates(
        baselineLength / 2, centerSegment.angle() - PI_OVER_2,
        centerCoords[0]
      )([[-1, 0], [1, 0]])

      // B. Target Area
      // Extend centerlines end point to double its length.
      // Move this point to the left and right to construct a backplane.
      // Connect backplane end points to corresponding baseline end points to
      // construct left and right target area bounding segments.
      // Intersect far/near circle with left/right bound to determine Target Area coordinates

      const targetWidth = length / 2
      const targetNearRadius = length * 0.75
      const targetFarRadius = length * 1.25

      const centerFarPoint = TS.extendSegment(0, 1, centerSegment).p1
      const backplaneCoords = TS.projectCoordinates(
        targetWidth / 2,
        centerSegment.angle() - PI_OVER_2, centerFarPoint
      )([[-1, 0], [1, 0]])

      const targetLeft = TS.segment(baselineCoords[0], backplaneCoords[0])
      const targetRight = TS.segment(baselineCoords[1], backplaneCoords[1])
      const center = centerCoords[0] // circle center

      const targetArea = [
        ...TS.intersectCircle(center, targetNearRadius, targetLeft),
        ...TS.intersectCircle(center, targetFarRadius, targetLeft),
        ...TS.intersectCircle(center, targetFarRadius, targetRight),
        ...TS.intersectCircle(center, targetNearRadius, targetRight)
      ]

      // D. Danger Zone 1 near depth
      // E. Danger Zone 1 far depth
      const dangerZone1Depth = TS.projectCoordinateY(centerCoords[0], centerSegment.angle())
      const dangerZone1Near = dangerZone1Depth(targetNearRadius - 800)
      const dangerZone1Far = dangerZone1Depth(targetFarRadius + 600)

      // F. Danger Zone 1 width
      // G. Danger Zone 2 width
      // Use target area left bounds median (mid point) to move points orthogonal
      // to the bound further to the left for respective danger zone widths.
      const leftBound = TS.segment(targetArea[0], targetArea[1])
      const median = leftBound.midPoint()
      const dangerZoneWidth = TS.projectCoordinateY(median, leftBound.angle() + PI_OVER_2)
      const dangerZone1Width = dangerZoneWidth(length * 0.2)
      const dangerZone2Width = dangerZoneWidth(length * 0.25)

      const featureGeometry = TS.collect([
        TS.lineString(baselineCoords),
        TS.multiPoint(targetArea),
        TS.multiPoint([dangerZone1Near, dangerZone1Far, dangerZone1Width, dangerZone2Width])
      ])

      feature.setGeometry(write(featureGeometry))
    }
  }
]
