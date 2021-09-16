import * as R from 'ramda'
import Mousetrap from 'mousetrap'
import Draw from 'ol/interaction/Draw'
import GeometryType from 'ol/geom/GeometryType'
import * as MILSTD from '../../symbology/2525c'
import { writeFeatureObject } from '../../store/format'
import * as TS from '../ts'
import * as EPSG from '../../epsg'


/**
 * @param {EventEmitter} emitter
 * @param {ol/Map} map
 * @param {Store} store
 */
export default options => {
  const { emitter, map, store } = options

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
    store.insertFeatures([geoJSON])
    cancel()
  }

  Mousetrap.bind('esc', cancel)
  emitter.on('command/entry/draw', ({ id }) => {
    // Cancel current draw unconditionally:
    cancel()

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
    match: ({ geometry }) => geometry.type === GeometryType.POLYGON,
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
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints })
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
      const angle = segment.angle() + Math.PI / 2
      const distance = segment.getLength() / goldenRatio

      const C = TS.projectCoordinate(coordinates[0])([angle, distance])
      feature.setGeometry(write(TS.geometryCollection([line, TS.point(C)])))
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
      const B = TS.projectCoordinate(C)([Math.PI / 4, distance])
      feature.setGeometry(write(TS.multiPoint([C, A, B].map(TS.point))))
    }
  },

  /* MultiPoint/fan (2-point) */
  {
    match: ({ geometry }) => geometry.layout === 'fan' &&
      Number.parseInt(geometry.maxPoints) === 2,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const distance = resolution * 50
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const point = read(geometry)

      const C = TS.coordinate(point)
      const A = TS.projectCoordinate(C)([0, distance])
      feature.setGeometry(write(TS.multiPoint([C, A].map(TS.point))))
    }
  },

  /* GeometryCollection/corridor (2-/n-point) */
  {
    match: ({ geometry }) => geometry.layout === 'corridor',
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints }),
    complete: (map, feature) => {
      const geometry = feature.getGeometry()
      const { read, write } = format(feature)
      const line = read(geometry)
      const min = (a, b) => Math.min(a, b)
      const segments = TS.segments(line)
      const minLength = segments.map(segment => segment.getLength()).reduce(min)
      const width = Math.min(minLength / 2, map.getView().getResolution() * 50)
      const A = TS.coordinate(TS.startPoint(line))
      const angle = segments[0].angle() - Math.PI / 2
      const point = TS.point(TS.projectCoordinate(A)([angle, width / 2]))
      feature.setGeometry(write(TS.geometryCollection([line, point])))
    }
  }
]
