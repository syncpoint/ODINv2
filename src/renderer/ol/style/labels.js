import * as R from 'ramda'
import { Jexl } from 'jexl'
import { PI_OVER_2 } from '../../../shared/Math'
import Props from './style-props'
import * as TS from '../ts'
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
const jexl = new Jexl()


/**
 *
 */
const textBoundingBox = (resolution, label) => {
  const textField = Props.textField(label)
  if (!textField) return null
  if (Props.textClipping(label) === 'none') return null

  // Prepare bounding box geometry (dimensions only, including padding).
  const lines = textField.split('\n')
  const [maxWidthPx, maxHeightPx] = lines.reduce((acc, line) => {
    const metrics = context.measureText(line)
    const width = metrics.width
    const height = 1.2 * lines.length * ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent))
    if (width > acc[0]) acc[0] = width
    if (height > acc[1]) acc[1] = height
    return acc
  }, [0, 0])

  const { x, y } = label.geometry.getCoordinates()[0]

  const padding = Props.textPadding(label) || 0
  const dx = (maxWidthPx / 2 + padding) * resolution
  const dy = (maxHeightPx / 2 + padding) * resolution

  const x1 = x - dx
  const x2 = x + dx
  const y1 = y - dy
  const y2 = y + dy
  const points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
  const geometry = TS.polygon(points.map(TS.coordinate))

  // Transform geometry (rotate/translate) to match
  // label options offset, justify and rotate.

  const rotate = Props.textRotate(label) || 0
  const justify = Props.textJustify(label) || 'center'
  const [offsetX, offsetY] = Props.textOffset(label) || [0, 0]

  const flipX = { start: -1, end: 1, center: 0 }
  const flipY = rotate < -PI_OVER_2 || rotate > PI_OVER_2 ? -1 : 1
  const tx = (-offsetX + flipX[justify] * (maxWidthPx / 2)) * resolution
  const ty = flipY * offsetY * resolution

  const theta = 2 * Math.PI - rotate
  const at = TS.AffineTransformation.translationInstance(-(x + tx), -(y + ty))
  at.rotate(theta)
  at.translate(x, y)

  return at.transform(geometry)
}


/**
 *
 */
const iconBoundingBox = (resolution, label) => {
  const scale = Props.iconScale(label)
  const width = Props.iconWidth(label) * scale / 4
  const height = Props.iconHeight(label) * scale / 4
  const rotate = Props.iconRotate(label) || 0
  const padding = Props.iconPadding(label) || 0
  const { x, y } = label.geometry.getCoordinates()[0]

  const x1 = x - (width + padding) * resolution
  const x2 = x + (width + padding) * resolution
  const y1 = y - (height + padding) * resolution
  const y2 = y + (height + padding) * resolution
  const points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
  const theta = 2 * Math.PI - rotate
  const geometry = TS.polygon(points.map(TS.coordinate))
  const rotation = TS.AffineTransformation.rotationInstance(theta, x, y)
  return rotation.transform(geometry)
}


/**
 *
 */
const boundingBox = resolution => label => {
  if (Props.textField(label)) return textBoundingBox(resolution, label)
  else if (Props.iconImage(label)) return iconBoundingBox(resolution, label)
  else return null
}


/**
 *
 */
export const clip = context => {
  const { resolution, styles } = context
  if (!styles || !styles.length) return styles

  // Subsequent labels are clipped against first geometry, only.
  // First geometry is modified accordingly.

  // For polygon geometries we have the option to convert it to
  // line string before clipping ['text-clipping': 'line']:
  const clipLine = styles.some(option => Props.textClipping(option) === 'line')
  const geometry = clipLine
    ? TS.lineString(styles[0].geometry.getCoordinates())
    : styles[0].geometry

  try {
    const boundingBoxes = styles.map(boundingBox(resolution)).filter(Boolean)
    styles[0].geometry = TS.difference([geometry, ...boundingBoxes])
  } catch (err) {
    console.warn('[clipping/clipLabels]', err.message)
  }

  return context
}


/**
 *
 */
export const texts = context => {
  const { properties, styles } = context
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

  context.styles = styles.map(style => {
    const textField = Props.textField(style)
    if (!textField) return style
    else return { ...style, 'text-field': evalSync(textField) }
  })

  return context
}
