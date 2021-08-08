import * as MILSTD from '../../2525c'
import corridor from './corridor'

const layouts = { corridor }

const segmentUpdaters = {
  Point: (vertex, [segmentData]) => {
    const segment = segmentData.segment
    const coordinates = vertex
    segment[0] = vertex
    segment[1] = vertex
    return coordinates
  },
  MultiPoint: (vertex, [segmentData]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[segmentData.index] = vertex
    segment[0] = vertex
    segment[1] = vertex
    return coordinates
  },
  LineString: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  MultiLineString: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const depth = segmentData.depth
    const coordinates = geometry.getCoordinates()
    coordinates[depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  Polygon: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const depth = segmentData.depth
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  MultiPolygon: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const depth = segmentData.depth
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  }
}


const defaultBehavior = feature => {

  const updateSegment = (vertex, dragSegment) => {
    const geometry = dragSegment[0].geometry
    if (!segmentUpdaters[geometry.getType()]) return

    const coordinates = segmentUpdaters[geometry.getType()](vertex, dragSegment)
    geometry.setCoordinates(coordinates)
  }

  const updateCoordinates = (role, coordinates) => {
    console.log('[updateCoordinates]', coordinates)
    feature.getGeometry().setCoordinates(coordinates)
  }

  return {
    updateSegment,
    updateCoordinates,
    capture: vertex => vertex,
    roles: () => ['DEFAULT'],
    geometry: () => feature.getGeometry()
  }
}

export const special = feature => {
  const descriptor = MILSTD.geometry(feature.get('sidc'))

  if (!descriptor || !descriptor.layout) return defaultBehavior(feature)

  return layouts[descriptor.layout]
    ? layouts[descriptor.layout](feature, descriptor)
    : defaultBehavior(feature)
}
