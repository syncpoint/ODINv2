import { Snap } from 'ol/interaction'

/**
 *
 */
export default options => {
  const { sources } = options
  const { selectableSource } = sources

  return new Snap({
    source: selectableSource,
    pixelTolerance: 5
  })
}
