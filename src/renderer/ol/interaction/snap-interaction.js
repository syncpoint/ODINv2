import { Snap } from 'ol/interaction'

/**
 *
 */
export default options => {
  const { selectableSource } = options
  return new Snap({
    source: selectableSource,
    pixelTolerance: 5
  })
}
