import Signal from '@syncpoint/signal'
import { renderTextToCanvas } from './text-shape-renderer'

/** Identity function for styles — no-op passthrough. */
const identity = styles => styles

/**
 * Style handler for text shape features.
 * Renders markdown text to a canvas and uses it as an OL Icon style.
 * Text scales with zoom level to avoid covering the map when zoomed out.
 */
export default $ => {

  $.textStyle = Signal.link((geometry, properties, centerResolution) => {
    const text = properties.text || 'Text'
    const textColor = properties['text-color'] || '#000000'
    const backgroundColor = properties['background-color'] || '#FFFFFF'
    const backgroundOpacity = properties['background-opacity'] !== undefined
      ? properties['background-opacity']
      : 0.8
    const fontSize = properties['font-size'] || 14
    const rotation = properties.rotation || 0

    const canvas = renderTextToCanvas({
      text,
      textColor,
      backgroundColor,
      backgroundOpacity,
      fontSize
    })

    // Scale text relative to the zoom level at which it was created.
    // At the creation resolution, scale = 1. Shrinks when zoomed out.
    const referenceResolution = properties['reference-resolution'] || centerResolution
    const baseScale = 1 / (window.devicePixelRatio || 1)
    const zoomScale = Math.min(1, referenceResolution / centerResolution)
    const scale = baseScale * Math.max(0.15, zoomScale)

    return [{
      id: 'style:text-shape/icon',
      geometry,
      'icon-image': canvas,
      'icon-rotation': (rotation * Math.PI) / 180,
      'icon-rotation-with-view': false,
      'icon-scale': scale
    }]
  }, [$.geometry, $.properties, $.centerResolution])

  $.selection = Signal.of([])
  $.labels = Signal.of([])

  $.styles = $.textStyle

  // Use identity functions for _evalSync and _clip stages —
  // text shapes don't need military symbol evaluation or bounding box clipping.
  return $.styles
    .ap($.styleRegistry)
    .ap(Signal.of(identity))
    .ap(Signal.of(identity))
    .ap($.styleFactory)
}
