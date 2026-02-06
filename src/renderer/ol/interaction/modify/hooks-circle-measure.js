import * as R from 'ramda'

/**
 * @typedef {import('ol/Feature').default} Feature
 * @typedef {import('ol/coordinate').Coordinate} Coordinate
 */

/**
 * @typedef {Object} Node
 * @property {Feature} feature - The feature being modified
 * @property {import('ol/geom/Point').default} geometry - The Point geometry
 * @property {number} index - The handle index (0 = center, 1 = edge)
 */

/**
 * Modify hooks for circle measure (Point geometry with radius property).
 * Index 0 = center handle (panning the circle)
 * Index 1 = edge handle (resizing the radius)
 *
 * @param {Node} node - The spatial index node
 * @param {number} offset - The vertex offset
 * @returns {Object} Hooks object with project and coordinates functions
 */
export default (node, offset) => {
  const { feature, geometry } = node
  const handleIndex = node.index

  // Get current center for radius calculations
  const getCenter = () => geometry.getCoordinates()

  // Center handle (index 0) - move the entire circle
  const moveCircle = newCoordinates => newCoordinates

  // Edge handle (index 1) - resize the radius
  const resizeCircle = newCoordinates => {
    const center = getCenter()
    const dx = newCoordinates[0] - center[0]
    const dy = newCoordinates[1] - center[1]
    const newRadius = Math.sqrt(dx * dx + dy * dy)

    // Update the radius property on the feature
    feature.set('radius', newRadius)

    // Return a copy of center coordinates (geometry doesn't move)
    // Must clone because getCoordinates() returns a reference to internal array
    return center.slice()
  }

  return {
    project: R.identity,
    coordinates: handleIndex === 0 ? moveCircle : resizeCircle
  }
}
