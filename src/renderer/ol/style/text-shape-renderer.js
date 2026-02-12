/**
 * Renders simple markdown text to an HTML Canvas element.
 * Supported markdown:
 *   # Heading 1
 *   ## Heading 2
 *   - List item / * List item
 *   Plain text (multiline)
 */

const PADDING = 12
const LINE_SPACING = 1.4

/**
 * Parse a simple markdown dialect into styled lines.
 */
const parseMarkdown = (text) => {
  const lines = text.split('\n')
  return lines.map(line => {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('## ')) {
      return { type: 'h2', text: trimmed.slice(3) }
    } else if (trimmed.startsWith('# ')) {
      return { type: 'h1', text: trimmed.slice(2) }
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return { type: 'list', text: trimmed.slice(2) }
    } else {
      return { type: 'text', text: line }
    }
  })
}

const fontForType = (type, baseFontSize) => {
  switch (type) {
    case 'h1': return `bold ${Math.round(baseFontSize * 1.6)}px sans-serif`
    case 'h2': return `bold ${Math.round(baseFontSize * 1.25)}px sans-serif`
    default: return `${baseFontSize}px sans-serif`
  }
}

const fontSizeForType = (type, baseFontSize) => {
  switch (type) {
    case 'h1': return Math.round(baseFontSize * 1.6)
    case 'h2': return Math.round(baseFontSize * 1.25)
    default: return baseFontSize
  }
}

/**
 * Render markdown text to a canvas and return it.
 *
 * @param {Object} options
 * @param {string} options.text - Markdown text
 * @param {string} options.textColor - CSS color for text
 * @param {string} options.backgroundColor - CSS color for background
 * @param {number} options.backgroundOpacity - 0..1
 * @param {number} options.fontSize - Base font size in px
 * @param {number} options.rotation - Rotation in degrees (applied externally by OL)
 * @returns {HTMLCanvasElement}
 */
export const renderTextToCanvas = ({
  text = 'Text',
  textColor = '#000000',
  backgroundColor = '#FFFFFF',
  backgroundOpacity = 0.8,
  fontSize = 14
}) => {
  const parsed = parseMarkdown(text)
  const pixelRatio = window.devicePixelRatio || 1

  // Measure pass — determine canvas size
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')

  let maxWidth = 0
  const lineMetrics = parsed.map(line => {
    const size = fontSizeForType(line.type, fontSize)
    const font = fontForType(line.type, fontSize)
    measureCtx.font = font
    const prefix = line.type === 'list' ? '• ' : ''
    const measured = measureCtx.measureText(prefix + line.text)
    const width = measured.width
    if (width > maxWidth) maxWidth = width
    return { ...line, font, size, width, prefix }
  })

  const canvasWidth = Math.ceil(maxWidth + PADDING * 2)
  const totalHeight = lineMetrics.reduce((sum, l) => sum + l.size * LINE_SPACING, 0)
  const canvasHeight = Math.ceil(totalHeight + PADDING * 2)

  // Render pass
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth * pixelRatio
  canvas.height = canvasHeight * pixelRatio
  canvas.style.width = canvasWidth + 'px'
  canvas.style.height = canvasHeight + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(pixelRatio, pixelRatio)

  // Background
  if (backgroundColor && backgroundOpacity > 0) {
    const r = parseInt(backgroundColor.slice(1, 3), 16)
    const g = parseInt(backgroundColor.slice(3, 5), 16)
    const b = parseInt(backgroundColor.slice(5, 7), 16)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`
    // Rounded rectangle
    const radius = 4
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(canvasWidth - radius, 0)
    ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, radius)
    ctx.lineTo(canvasWidth, canvasHeight - radius)
    ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - radius, canvasHeight)
    ctx.lineTo(radius, canvasHeight)
    ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - radius)
    ctx.lineTo(0, radius)
    ctx.quadraticCurveTo(0, 0, radius, 0)
    ctx.closePath()
    ctx.fill()
  }

  // Text
  ctx.fillStyle = textColor
  ctx.textBaseline = 'top'

  let y = PADDING
  for (const line of lineMetrics) {
    ctx.font = line.font
    ctx.fillText(line.prefix + line.text, PADDING, y)
    y += line.size * LINE_SPACING
  }

  return canvas
}
