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
    // boundingBoxes.forEach(geometry => styles.push({ 'line-color': 'red', 'line-width': 1, geometry }))
    styles[0].geometry = TS.difference([geometry, ...boundingBoxes])
  } catch (err) {
    console.warn('[clipping/clipLabels]', err.message)
  }

  return context
}


/**
 *
 */
const polygonAnchors = geometry => {
  const ring = geometry.getExteriorRing()
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)

  const lazy = function (fn) {
    let evaluated = false
    let value

    return function () {
      if (evaluated) return value
      value = fn.apply(this, arguments)
      evaluated = true
      return value
    }
  }

  const xIntersection = lazy(() => {
    const axis = TS.lineString([
      TS.coordinate(envelope.getMinX(), centroid.y),
      TS.coordinate(envelope.getMaxX(), centroid.y)
    ])

    return geometry.intersection(axis).getCoordinates()
  })

  const yIntersection = lazy(() => {
    const axis = TS.lineString([
      TS.coordinate(centroid.x, envelope.getMinY()),
      TS.coordinate(centroid.x, envelope.getMaxY())
    ])

    return geometry.intersection(axis).getCoordinates()
  })

  const center = lazy(() => TS.point(centroid))
  const left = lazy(() => TS.point(xIntersection()[0]))
  const right = lazy(() => TS.point(xIntersection()[1]))
  const bottom = lazy(() => TS.point(yIntersection()[0]))
  const top = lazy(() => TS.point(yIntersection()[1]))
  const positions = { center, top, bottom, right, left }

  return {
    anchorPoint: anchor => positions[anchor](),
    angle: () => null
  }
}


/**
 *
 */
const lineStringAnchors = geometry => {
  const segments = TS.segments(geometry)
  const line = TS.lengthIndexedLine(geometry)
  const endIndex = line.getEndIndex()
  const coordAt = (fraction, offset = 0) => line.extractPoint(endIndex * fraction + offset)
  const pointAt = (fraction, offset = 0) => TS.point(coordAt(fraction, offset))
  const numPoints = geometry.getNumPoints()

  const segment = fraction => TS.segment([
    coordAt(fraction, -0.05),
    coordAt(fraction, +0.05)
  ])

  const angle = anchor => {
    if (!anchor) return segment(0.5).angle()
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return segment(0.5).angle()
      else if (anchor.includes('left')) return R.head(segments).angle()
      else if (anchor.includes('right')) return R.last(segments).angle()
    } else return segment(anchor).angle()
  }

  const anchorPoint = anchor => {
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return pointAt(0.5)
      else if (anchor.includes('left')) return geometry.getPointN(0)
      else if (anchor.includes('right')) return geometry.getPointN(numPoints - 1)
      else return pointAt(0.5)
    } else return pointAt(anchor)
  }

  return { anchorPoint, angle }
}


/**
 *
 */
export const anchors = context => {
  const { styles, geometry } = context
  const normalize = angle => TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle)
  const nullAnchors = () => ({ anchorPoint: () => null, angle: () => null })
  const factories = {
    Polygon: polygonAnchors,
    LineString: lineStringAnchors
  }

  const geometryType = geometry.getGeometryType()
  const factory = (factories[geometryType] || nullAnchors)(geometry)

  context.styles = styles.map(label => {
    const clone = { ...label }
    if (clone.geometry) return clone

    const textField = Props.textField(clone)
    const anchor = Props.textAnchor(clone) ||
      Props.symbolAnchor(clone) ||
      Props.iconAnchor(clone) ||
      // anchor is optional for text labels
      (textField ? 'center' : null)

    if (anchor === null) return clone

    const geometry = factory.anchorPoint(anchor)
    if (geometry) clone.geometry = geometry
    const angle = factory.angle(anchor)
    if (angle !== null) {
      const property = Props.textAnchor(clone)
        ? 'text-rotate'
        : 'icon-rotate'
      clone[property] = normalize(angle)
    }

    return clone
  })

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
