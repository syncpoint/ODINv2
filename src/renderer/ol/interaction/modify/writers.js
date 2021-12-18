import * as R from 'ramda'
import * as Extent from 'ol/extent'
import RBush from 'ol/structs/RBush'
import * as MILSTD from '../../../symbology/2525c'
import { geometryType } from '../../geometry'
import { Hooks } from './hooks'

/**
 * signature :: ol.Feature -> String
 * Geometry type plus optional layout from feature descriptors.
 */
const signature = feature => {
  const geometry = MILSTD.geometry(feature.get('sidc'))
  const layout = geometry && geometry.layout
  const type = layout
    ? geometryType(feature)
    : feature.getGeometry().getType()
  return layout ? `${type}-${geometry.layout}` : type
}

/**
 * writeIndex :: ol.Feature => ol.structs.RBush
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
  const { geometry } = options
  const coordinate = geometry.getCoordinates()
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
  const { geometry } = options
  const splitable = options.descriptor.maxPoints !== 2 &&
    (options.descriptor && options.descriptor.layout !== 'orbit')

  const segments = R.aperture(2, geometry.getCoordinates())
  return segments.map((vertices, index) => ({
    ...options,
    splitable,
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
  const { geometry } = options
  const splitable = options.descriptor.layout !== 'rectangle'

  return geometry.getCoordinates().reduce((acc, ring, q) => {
    return acc.concat(R.aperture(2, ring).map((vertices, index) => ({
      ...options,
      splitable,
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
  const { geometry, depth } = node
  const offset = node.index + index
  const hooks = Hooks.get(node, offset)
  const coordinates = geometry.getCoordinates()

  switch (geometry.getType()) {
    case 'LineString':
      if (coordinates.length > 2) coordinates.splice(offset, 1)
      break
    case 'MultiLineString':
      if (coordinates[depth[0]].length > 2) coordinates[depth[0]].splice(offset, 1)
      break
    case 'Polygon':
      if (coordinates[depth[0]].length > 4) {
        coordinates[depth[0]].splice(offset, 1)
        close(coordinates[depth[0]], offset)
      }
      break
    case 'MultiPolygon':
      if (coordinates[depth[0]][depth[1]].length > 4) {
        coordinates[depth[0]][depth[1]].splice(offset, 1)
        close(coordinates[depth[0]][depth[1]], offset)
      }
      break
  }

  return hooks.coordinates(coordinates)
}
