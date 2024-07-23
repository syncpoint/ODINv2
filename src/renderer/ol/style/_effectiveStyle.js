
/**
 *
 */
export default (globalStyle, schemeStyle, layerStyle, featureStyle) => {
  if (!layerStyle['line-color']) delete layerStyle['line-color']
  if (!layerStyle['line-halo-color']) delete layerStyle['line-halo-color']
  return {
    ...globalStyle,
    ...schemeStyle,
    ...layerStyle,
    ...featureStyle
  }
}
