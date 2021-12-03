import * as R from 'ramda'
import * as Extent from 'ol/extent'
import RBush from 'ol/structs/RBush'
import * as MILSTD from '../../../symbology/2525c'
import { geometryType } from '../../geometry'

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
 * spatialIndex :: ol.Feature => ol.structs.RBush
 * Create new spatial index (R-Bush) from feature.
 */
export const spatialIndex = feature => {
  const rbush = new RBush()
  const geometry = feature.getGeometry()
  if (!geometry) return rbush

  const type = geometry.getType()
  const nodes = Writers[type]({
    feature,
    geometry,
    signature: signature(feature),
    descriptor: MILSTD.geometry(feature.get('sidc'))
  })

  const [extents, values] = nodes.reduce((acc, node) => {
    const [extents, values] = acc
    extents.push(node.extent)
    values.push(node)
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
    segment: [coordinate, coordinate],
    extent: geometry.getExtent()
  }]
}

Writers.MultiPoint = options => {
  const { geometry } = options
  return geometry.getCoordinates().map((coordinate, index) => ({
    ...options,
    index,
    segment: [coordinate, coordinate],
    extent: geometry.getExtent()
  }))
}

Writers.LineString = options => {
  const { geometry } = options
  const segments = R.aperture(2, geometry.getCoordinates())
  return segments.map((segment, index) => ({
    ...options,
    index,
    segment,
    extent: Extent.boundingExtent(segment)
  }))
}

Writers.MultiLineString = options => {
  const { geometry } = options
  return geometry.getCoordinates().reduce((acc, line, q) => {
    return acc.concat(R.aperture(2, line).map((segment, index) => ({
      ...options,
      depth: [q],
      index,
      segment,
      extent: Extent.boundingExtent(segment)
    })))
  }, [])
}

Writers.Polygon = options => {
  const { geometry } = options
  return geometry.getCoordinates().reduce((acc, ring, q) => {
    return acc.concat(R.aperture(2, ring).map((segment, index) => ({
      ...options,
      index,
      segment,
      depth: [q],
      extent: Extent.boundingExtent(segment)
    })))
  }, [])
}

Writers.MultiPolygon = options => {
  const { geometry } = options
  return geometry.getCoordinates().reduce((acc, polygon, q) => {
    return polygon.reduce((acc, ring, r) => {
      return acc.concat(R.aperture(2, ring).map((segment, index) => ({
        ...options,
        index,
        segment,
        depth: [q, r],
        extent: Extent.boundingExtent(segment)
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
