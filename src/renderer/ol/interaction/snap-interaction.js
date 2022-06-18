import { Snap } from 'ol/interaction'

/**
 *
 */
export default options => {
  const { visibleSource } = options
  return new Snap({
    source: visibleSource,
    pixelTolerance: 5
  })
}
