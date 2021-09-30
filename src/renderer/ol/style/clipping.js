import * as AF from 'transformation-matrix' // affine transformations
import * as geom from 'ol/geom'
import { PI_OVER_2 } from '../../../shared/Math'
import { Props } from './styles'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

export const boundingBox = resolution => label => {
  if (Props.textClipping(label) === false) return null

  const { geometry } = label
  const textField = Props.textField(label)
  const textFont = Props.textFont(label)
  const textJustify = Props.textJustify(label)
  const textRotate = Props.textRotate(label) || 0
  const textPadding = Props.textPadding(label) || 0
  const [offsetX, offsetY] = Props.textOffset(label) || [0, 0]
  const [x, y] = geometry.getCoordinates()
  const flipY = textRotate < -PI_OVER_2 || textRotate > PI_OVER_2 ? -1 : 1
  const flipX = textJustify ? textJustify === 'start' ? -1 : 1 : 0

  const lines = textField.split('\n')
  context.font = textFont
  const [width, height] = lines.reduce((acc, line) => {
    const metrics = context.measureText(line)
    const width = resolution * (metrics.width / 2)
    const height = 1.2 * lines.length * resolution * ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2)
    if (width > acc[0]) acc[0] = width
    if (height > acc[1]) acc[1] = height
    return acc
  }, [0, 0])

  const x1 = x - width - textPadding * resolution
  const x2 = x + width + textPadding * resolution
  const y1 = y - height - textPadding * resolution
  const y2 = y + height + textPadding * resolution
  const points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
  const tx = width * flipX - offsetX * resolution
  const ty = offsetY * resolution * flipY

  const transform = AF.compose(
    AF.translate(x, y),
    AF.rotate(2 * Math.PI - textRotate),
    AF.translate(-(x + tx), -(y + ty))
  )

  return new geom.Polygon([AF.applyToPoints(transform, points)])
}
