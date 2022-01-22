import * as TS from '../ts'

const handleStyles = {
  selected: 'style:circle-handle',
  multiple: 'style:rectangle-handle'
}

export const makeHandles = context => {
  const { styles, mode, simplifiedGeometry, simplified } = context
  if (simplified && mode !== 'multiple') return context
  if (!handleStyles[mode]) return context

  // Experimental:
  // Don't display handle for 1-point symbols:
  const geometryType = simplifiedGeometry.getGeometryType()
  if (geometryType === 'Point') return context

  const points = () => {
    switch (mode) {
      case 'selected': return TS.multiPoint(TS.points(simplifiedGeometry))
      case 'multiple': return TS.points(simplifiedGeometry)[0]
    }
  }

  styles.push({ id: handleStyles[mode], geometry: points() })
  return context
}
