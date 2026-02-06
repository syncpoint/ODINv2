import * as R from 'ramda'
import * as Extent from 'ol/extent'
import RBush from 'ol/structs/RBush'
import * as MILSTD from '../../../symbology/2525c'
import { geometryType } from '../../../model/geometry'
import { Hooks } from './hooks'

/**
 * signature :: ol/Feature -> String
 * Geometry type plus optional layout from feature descriptors.
 */
const signature = feature => {
  // Check for Point with radius property (circle measure)
  const geom = feature.getGeometry()
  const props = feature.getProperties()
  const radius = props.radius
  if (geom.getType() === 'Point' && typeof radius === 'number') {
    return 'Point-circle-measure'
  }

  const geometry = MILSTD.geometry(feature.get('sidc'))
  const layout = geometry && geometry.layout
  const type = layout
    ? geometryType(feature)
    : geom.getType()
  return layout ? `${type}-${geometry.layout}` : type
}

/**
 * writeIndex :: ol/Feature => ol/structs/RBush
 * Create new spatial index (R-Bush) from feature.
 */
export const writeIndex = feature => {
  const rbush = new RBush()
  const geometry = feature.getGeometry()
  if (!geometry) return rbush

  const type = geometry.getType()
  const segments = Writers[type]({
    feature,
    geometry,
    signature: signature(feature),
    descriptor: MILSTD.geometry(feature.get('sidc'))
  })

  const [extents, values] = segments.reduce((acc, segment) => {
    const [extents, values] = acc
    extents.push(segment.extent)
    values.push(segment)
    return acc
  }, [[], []])

  rbush.load(extents, values)
  return rbush
}


/**
 * Geometry handler is responsible for indexing a feature's
 * geometry, i.e. write spatial index and updating feature's geometry
 * and spatial index for move vextex, add vertex and remove vertex.
 */
export const Writers = {}

Writers.Point = options => {
  const { geometry, feature } = options
  const coordinate = geometry.getCoordinates()
  const props = feature.getProperties()
  const radius = props.radius

  // For circle measure (Point with radius), return two handles:
  // index 0: center point (for panning)
  // index 1: edge point (for resizing)
  if (typeof radius === 'number') {
    const edgeCoordinate = [coordinate[0] + radius, coordinate[1]]
    return [
      {
        ...options,
        index: 0,
        vertices: [coordinate, coordinate],
        extent: geometry.getExtent()
      },
      {
        ...options,
        index: 1,
        vertices: [edgeCoordinate, edgeCoordinate],
        extent: Extent.boundingExtent([edgeCoordinate])
      }
    ]
  }

  return [{
    ...options,
    vertices: [coordinate, coordinate],
    extent: geometry.getExtent()
  }]
}


Writers.MultiPoint = options => {
  const { geometry } = options
  return geometry.getCoordinates().map((coordinate, index) => ({
    ...options,
    index,
    vertices: [coordinate, coordinate],
    extent: geometry.getExtent()
  }))
}

Writers.LineString = options => {
  const { geometry, descriptor } = options

  // Cases where a line segment may NOT be splitted (add vertex):
  // - max points is explicitly limited to 2
  // - geometries with orbit layout

  const fix = descriptor
    ? (descriptor.maxPoints === 2 || descriptor.layout === 'orbit')
    : false

  const segments = R.aperture(2, geometry.getCoordinates())
  return segments.map((vertices, index) => ({
    ...options,
    splittable: !fix,
    index,
    vertices,
    extent: Extent.boundingExtent(vertices)
  }))
}

Writers.MultiLineString = options => {
  const { geometry } = options
  return geometry.getCoordinates().reduce((acc, line, q) => {
    return acc.concat(R.aperture(2, line).map((vertices, index) => ({
      ...options,
      depth: [q],
      index,
      vertices,
      extent: Extent.boundingExtent(vertices)
    })))
  }, [])
}

Writers.Polygon = options => {
  const { geometry, descriptor } = options

  // Cases where no vertex may be added:
  // - geometries with layout rectangle

  const fix = descriptor
    ? descriptor.layout === 'rectangle'
    : false

  return geometry.getCoordinates().reduce((acc, ring, q) => {
    return acc.concat(R.aperture(2, ring).map((vertices, index) => ({
      ...options,
      splittable: !fix,
      index,
      vertices,
      depth: [q],
      extent: Extent.boundingExtent(vertices)
    })))
  }, [])
}

Writers.MultiPolygon = options => {
  const { geometry } = options
  return geometry.getCoordinates().reduce((acc, polygon, q) => {
    return polygon.reduce((acc, ring, r) => {
      return acc.concat(R.aperture(2, ring).map((vertices, index) => ({
        ...options,
        index,
        vertices,
        depth: [q, r],
        extent: Extent.boundingExtent(vertices)
      })))
    }, acc)
  }, [])
}

Writers.GeometryCollection = options => {
  const { geometry } = options
  return geometry.getGeometriesArray().reduce((acc, geometry) => {
    const geometryType = geometry.getType()
    const write = Writers[geometryType]
    return acc.concat(write({ ...options, geometry }))
  }, [])
}

const close = (ring, index) => {
  if (index === 0) ring[ring.length - 1] = ring[0]
  else if (index >= ring.length - 1) ring[0] = ring[ring.length - 1]
}

export const updateVertex = (node, index) => {
  const { geometry, depth } = node
  const offset = node.index + index
  const hooks = Hooks.get(node, offset)

  return (coordinate, condition) => {
    let coordinates = geometry.getCoordinates()
    const projected = hooks.project(coordinate, condition)

    switch (geometry.getType()) {
      case 'Point':
        coordinates = projected
        break
      case 'MultiPoint':
        coordinates[node.index] = projected
        break
      case 'LineString':
        coordinates[offset] = projected
        break
      case 'MultiLineString':
        coordinates[depth[0]][offset] = projected
        break
      case 'Polygon':
        coordinates[depth[0]][offset] = projected
        close(coordinates[depth[0]], offset)
        break
      case 'MultiPolygon':
        coordinates[depth[0]][depth[1]][offset] = projected
        close(coordinates[depth[0]][depth[1]], offset)
        break
    }

    coordinates = hooks.coordinates(coordinates, condition)
    return [coordinates, projected]
  }
}

export const insertVertex = (node, coordinate) => {
  const { geometry, depth } = node
  const offset = node.index + 1
  const hooks = Hooks.get(node, offset)
  const coordinates = geometry.getCoordinates()

  switch (geometry.getType()) {
    case 'LineString':
      coordinates.splice(offset, 0, coordinate)
      break
    case 'MultiLineString':
      coordinates[depth[0]].splice(offset, 0, coordinate)
      break
    case 'Polygon':
      coordinates[depth[0]].splice(offset, 0, coordinate)
      close(coordinates[depth[0]], offset)
      break
    case 'MultiPolygon':
      coordinates[depth[0]][depth[1]].splice(offset, 0, coordinate)
      close(coordinates[depth[0]][depth[1]], offset)
      break
  }

  return [hooks.coordinates(coordinates), updateVertex(node, 1)]
}

export const removeVertex = (node, index) => {
  const { geometry, depth, descriptor } = node
  const offset = node.index + index

  const guards = {
    LineString: coordinates => coordinates.length > 2,
    MultiLineString: coordinates => coordinates[depth[0]].length > 2,
    Polygon: coordinates =>
      coordinates[depth[0]].length > 4 &&
      (!descriptor || descriptor.layout !== 'rectangle'),
    MultiPolygon: coordinates => coordinates[depth[0]][depth[1]].length > 4
  }

  const mutators = {
    LineString: R.tap(coordinates => coordinates.splice(offset, 1)),
    MultiLineString: R.tap(coordinates => coordinates[depth[0]].splice(offset, 1)),
    Polygon: R.tap(coordinates => {
      coordinates[depth[0]].splice(offset, 1)
      close(coordinates[depth[0]], offset)
    }),
    MultiPolygon: R.tap(coordinates => {
      coordinates[depth[0]][depth[1]].splice(offset, 1)
      close(coordinates[depth[0]][depth[1]], offset)
    })
  }

  const type = geometry.getType()
  const coordinates = geometry.getCoordinates()
  const mutator = guards[type](coordinates) ? mutators[type] : R.identity
  const hooks = Hooks.get(node, offset)
  return hooks.coordinates(mutator(coordinates))
}
