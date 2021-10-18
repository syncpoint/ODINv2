import { Snap } from 'ol/interaction'

/**
 *
 */
export default options => {
  const { featureSource } = options
  return new Snap({
    source: featureSource,
    pixelTolerance: 5
  })
}
