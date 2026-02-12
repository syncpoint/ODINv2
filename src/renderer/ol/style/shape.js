import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import _selection from './_selection'
import _simplifiedGeometry from './_simplifiedGeometry'
import _lineSmoothing from './_lineSmoothing'
import _smoothenedGeometry from './_smoothenedGeometry'
import _rewrite from './_rewrite'
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
    const lineDash = effectiveStyle['line-dash']
    const dashArray = lineDash === 'dashed'
      ? [14, 6]
      : lineDash === 'dotted'
        ? [2, 6]
        : undefined

    const lineColor = effectiveStyle['line-color']
    const lineWidth = effectiveStyle['line-width']

    const styles = [{
      id: 'style:shape/stroke',
      geometry,
      ...(lineColor ? { 'line-color': lineColor } : {}),
      ...(lineWidth ? { 'line-width': lineWidth } : {}),
      ...(dashArray ? { 'line-dash-array': dashArray } : {})
    }]

    // Add fill for polygons
    if (geometryType === 'Polygon' && effectiveStyle['fill-color']) {
      const fillOpacity = effectiveStyle['fill-opacity'] !== undefined
        ? effectiveStyle['fill-opacity']
        : 0.2

      const fillColor = effectiveStyle['fill-color']
      let finalFillColor = fillColor
      if (fillColor && fillOpacity < 1) {
        const r = parseInt(fillColor.slice(1, 3), 16)
        const g = parseInt(fillColor.slice(3, 5), 16)
        const b = parseInt(fillColor.slice(5, 7), 16)
        finalFillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`
      }

      styles[0] = {
        id: 'style:shape/fill',
        geometry,
        ...(lineColor ? { 'line-color': lineColor } : {}),
        ...(lineWidth ? { 'line-width': lineWidth } : {}),
        ...(dashArray ? { 'line-dash-array': dashArray } : {}),
        'fill-color': finalFillColor
      }
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
