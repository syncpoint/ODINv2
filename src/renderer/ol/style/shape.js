import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import _simplifiedGeometry from './_simplifiedGeometry'
import _lineSmoothing from './_lineSmoothing'
import _smoothenedGeometry from './_smoothenedGeometry'
import _clip from './_clip'
import _evalSync from './_evalSync'
import keyequals from './keyequals'

/**
 * Style handler for shape features (lines and polygons without military semantics).
 * Simplified version using default-stroke style, avoiding JTS transforms.
 */
export default $ => {
  $.simplifiedGeometry = Signal.link(_simplifiedGeometry, [$.geometry, $.centerResolution], { equals: keyequals() })
  $.lineSmoothing = $.effectiveStyle.map(_lineSmoothing)
  $.smoothenedGeometry = Signal.link(_smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])

  // Determine geometry type for choosing stroke vs stroke+fill
  $.geometryType = $.geometry.map(geometry => geometry.getType())

  // Build shape styles based on effective style (which includes featureStyle)
  $.shape = Signal.link((geometry, geometryType, effectiveStyle) => {
    const lineDash = effectiveStyle['line-dash'] || 'solid'
    const dashArray = lineDash === 'dashed'
      ? [14, 6]
      : lineDash === 'dotted'
        ? [2, 6]
        : undefined

    // line-color may be explicitly undefined/null ("none" in palette)
    const hasLine = effectiveStyle['line-color'] !== undefined && effectiveStyle['line-color'] !== null
    const lineColor = hasLine ? effectiveStyle['line-color'] : undefined
    const lineWidth = effectiveStyle['line-width'] || 2

    // Compute fill for polygons (only when explicitly set)
    let finalFillColor
    const hasFill = geometryType === 'Polygon' && effectiveStyle['fill-color']
    if (hasFill) {
      const fillOpacity = effectiveStyle['fill-opacity'] !== undefined
        ? effectiveStyle['fill-opacity']
        : 0.2

      const fillColor = effectiveStyle['fill-color']
      if (fillColor && fillOpacity < 1) {
        const r = parseInt(fillColor.slice(1, 3), 16)
        const g = parseInt(fillColor.slice(3, 5), 16)
        const b = parseInt(fillColor.slice(5, 7), 16)
        finalFillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`
      } else {
        finalFillColor = fillColor
      }
    }

    // Build style: fill-only, stroke-only, or both
    const styles = []

    if (hasFill && hasLine) {
      // Combined stroke + fill
      styles.push({
        id: 'style:shape/fill',
        geometry,
        'line-color': lineColor,
        'line-width': lineWidth,
        ...(dashArray ? { 'line-dash-array': dashArray } : {}),
        'fill-color': finalFillColor
      })
    } else if (hasFill) {
      // Fill only, no stroke — override registry default with transparent
      styles.push({
        id: 'style:shape/fill',
        geometry,
        'line-color': 'transparent',
        'line-width': 0,
        'fill-color': finalFillColor
      })
    } else if (hasLine) {
      // Stroke only (lines, or polygons without fill)
      styles.push({
        id: 'style:shape/stroke',
        geometry,
        'line-color': lineColor,
        'line-width': lineWidth,
        ...(dashArray ? { 'line-dash-array': dashArray } : {})
      })
    } else {
      // Neither stroke nor fill — default to black stroke so the shape stays visible
      // (this is the initial state before any styling is applied)
      styles.push({
        id: 'style:shape/stroke',
        geometry,
        'line-color': '#000000',
        'line-width': lineWidth
      })
    }

    return styles
  }, [$.smoothenedGeometry, $.geometryType, $.effectiveStyle])

  // No selection handles for now (avoids JTS transform issues)
  $.selection = Signal.of([])
  $.labels = Signal.of([])

  $.styles = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [$.shape, $.labels, $.selection]
  )

  return $.styles
    .ap($.styleRegistry)
    .ap(Signal.link(_evalSync, [$.sidc, $.properties, Signal.of({})]))
    .ap($.centerResolution.map(_clip))
    .ap($.styleFactory)
}
