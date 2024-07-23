
/**
 *
 */
export default (geometry, resolution) => {
  const geometryType = geometry.getType()
  const coordinates = geometry.getCoordinates()
  const simplify =
    (geometryType === 'Polygon' && coordinates[0].length > 50) ||
    (geometryType === 'LineString' && coordinates.length > 50)

  return simplify
    ? geometry.simplify(resolution)
    : geometry
}
