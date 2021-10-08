

/**
 *
 */
export const makeGuideLines = context => {
  const { styles, mode, simplified, simplifiedGeometry } = context
  if (simplified) return context
  if (mode !== 'selected') return context

  styles.push({ id: 'style:guide-stroke', geometry: simplifiedGeometry })
  return context
}
