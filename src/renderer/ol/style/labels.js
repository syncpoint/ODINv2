import * as R from 'ramda'
import { Jexl } from 'jexl'
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

/**
 *
 */
const textBoundingBox = ({ TS, PI_OVER_2, resolution }, props) => {
  const textField = props['text-field']
  if (!textField) return null
  if (props['text-clipping'] === 'none') return null

  // Prepare bounding box geometry (dimensions only, including padding).
  const lines = textField.split('\n')
  const [maxWidthPx, maxHeightPx] = lines.reduce((acc, line) => {
    context.font = props['text-font']
    const metrics = context.measureText(line)
    const width = metrics.width
    const height = 1.2 * lines.length * ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent))
    if (width > acc[0]) acc[0] = width
    if (height > acc[1]) acc[1] = height
    return acc
  }, [0, 0])

  const { x, y } = props.geometry.getCoordinates()[0]
  const padding = props['text-padding'] || 0
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

  const rotate = props['text-rotate'] || 0
  const justify = props['text-justify'] || 'center'
  const [offsetX, offsetY] = props['text-offset'] || [0, 0]

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
const iconBoundingBox = ({ TS, resolution }, props) => {
  const scale = props['icon-scale']
  if (!scale) return null

  const width = props['icon-width'] * scale / 4
  const height = props['icon-height'] * scale / 4
  const rotate = props['icon-rotate'] || 0
  const padding = props['icon-padding'] || 0
  const { x, y } = props.geometry.getCoordinates()[0]

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
export const boundingBox = R.curry((context, style) => {
  if (style['text-field']) return textBoundingBox(context, style)
  else if (style['icon-image']) return iconBoundingBox(context, style)
  else return null
})

const jexl = new Jexl()

/**
 *
 */
export const evalSync = context => {
  // const context = { modifiers, echelon: ' ⏺⏺⏺ ' }
  console.dir(context)

  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, context)

  return props => {
    props = Array.isArray(props) ? props : [props]
    return props.reduce((acc, spec) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSync(spec['text-field'])
        if (textField) acc.push({ ...spec, 'text-field': textField })
      }

      return acc
    }, [])
  }
}
