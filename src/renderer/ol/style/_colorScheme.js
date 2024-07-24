
/**
 *
 */
export default (globalStyle, layerStyle, featureStyle) => {
  return featureStyle?.['color-scheme'] ||
    layerStyle?.['color-scheme'] ||
    globalStyle?.['color-scheme'] ||
    'medium'
}
