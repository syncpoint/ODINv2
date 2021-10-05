import * as R from 'ramda'
import { Jexl } from 'jexl'
import * as AF from 'transformation-matrix' // affine transformations
import * as TS from '../ts'
import { PI_OVER_2 } from '../../../shared/Math'
import { transform } from '../geometry'
import { makeStyles, Props } from './styles'
import { parameterized } from '../../symbology/2525c'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

/**
 *
 */
const boundingBox = resolution => label => {
  const textField = Props.textField(label)
  if (!textField) return null
  if (Props.textClipping(label) === 'none') return null

  const { geometry } = label
  const textFont = Props.textFont(label)
  const textJustify = Props.textJustify(label)
  const textRotate = Props.textRotate(label) || 0
  const textPadding = Props.textPadding(label) || 0
  const [offsetX, offsetY] = Props.textOffset(label) || [0, 0]
  const { x, y } = geometry.getCoordinates()[0]
  const flipY = textRotate < -PI_OVER_2 || textRotate > PI_OVER_2 ? -1 : 1
  const flipX = textJustify ? textJustify === 'start' ? -1 : 1 : 0

  const lines = textField.split('\n')
  context.font = textFont
  const [width, height] = lines.reduce((acc, line) => {
    const metrics = context.measureText(line)
    const width = resolution * (metrics.width / 2) / 1.5
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

  return TS.polygon(AF.applyToPoints(transform, points).map(TS.coordinate))
}


const clipLabels = ({ resolution, styles }) => {
  if (!styles || !styles.length) return styles

  // Subsequent labels are clipped again first geometry, only.
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

  return styles
}

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

  return styles => {
    return styles.map(label => {
      if (!Props.textField(label)) return label
      if (label.geometry) return label

      const anchor = Props.textAnchor(label)
      const geometry = positions[anchor]()
      if (!geometry) {
        console.warn('unknown anchor position', anchor)
        return label
      } else return { ...label, geometry }
    })
  }
}

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

  const angle = label => {
    const anchor = Props.textAnchor(label)
    if (!anchor) return segment(0.5).angle()

    if (isNaN(anchor)) {
      if (anchor.includes('center')) return segment(0.5).angle()
      else if (anchor.includes('left')) return R.head(segments).angle()
      else if (anchor.includes('right')) return R.last(segments).angle()
    } else segment(anchor).angle()
  }

  const anchor = label => {
    const anchor = Props.textAnchor(label)
    if (!anchor) return pointAt(0.5)

    if (isNaN(anchor)) {
      if (anchor.includes('center')) return pointAt(0.5)
      else if (anchor.includes('left')) return geometry.getPointN(0)
      else if (anchor.includes('right')) return geometry.getPointN(numPoints - 1)
      else return pointAt(0.5)
    } else return pointAt(anchor)
  }

  return styles => {
    return styles.map(label => {
      if (!Props.textField(label)) return label
      if (label.geometry) return label

      const textAnchor = Props.textAnchor(label)
      const geometry = anchor(label)
      if (!geometry) {
        console.warn('unknown anchor position', textAnchor)
        return label
      } else {
        label.geometry = geometry
        label['text-rotate'] = TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle(label))
        return label
      }
    })
  }
}

const labelAnchors = ({ styles, geometry }) => {
  const geometryType = geometry.getGeometryType()
  switch (geometryType) {
    case 'Polygon': return polygonAnchors(geometry)(styles)
    case 'LineString': return lineStringAnchors(geometry)(styles)
    default: return styles
  }
}

const jexl = new Jexl()

const resolveLabelTexts = (properties, styles) => {
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

  return styles.map(style => {
    const textField = Props.textField(style)
    if (!textField) return style
    else return { ...style, 'text-field': evalSync(textField) }
  })
}

const handleStyles = {
  selected: 'style:circle-handle',
  multiple: 'style:rectangle-handle'
}

const handles = ({ styles, mode, geometry }) => {
  if (!handleStyles[mode]) return

  const points = () => {
    switch (mode) {
      case 'selected': return TS.multiPoint(TS.points(geometry))
      case 'multiple': return TS.points(geometry)[0]
    }
  }

  styles.push({ id: handleStyles[mode], geometry: points() })
}

const guideLines = context => {
  if (context.mode !== 'selected') return
  context.styles.push({ id: 'style:guide-stroke', geometry: context.geometry })
}

export const pipeline = (styles, { feature, resolution, mode, geometryType }) => {
  const { read, write } = transform(feature.getGeometry())
  const geometry = read(feature.getGeometry())
  const properties = feature.getProperties()
  const writeGeometry = styles => styles.map(style => ({ ...style, geometry: write(style.geometry) }))
  const styleFactory = makeStyles(feature, mode)
  const sidc = parameterized(feature.get('sidc'))
  const key = styles[`${geometryType}:${sidc}`]
    ? `${geometryType}:${sidc}`
    : `${geometryType}:DEFAULT`

  // TODO: polygon fill
  // TODO: smoothed geometry
  return R.compose(
    ({ styles }) => styles.map(styleFactory.makeStyle),
    R.tap(context => (context.styles = writeGeometry(context.styles))),
    R.tap(guideLines),
    R.tap(handles),
    R.tap(clipLabels),
    R.tap(context => (context.styles = resolveLabelTexts(properties, context.styles))),
    R.tap(context => (context.styles = labelAnchors(context))),
    R.tap(context => context.styles.push(...(styles[`LABELS:${sidc}`] || []).flat())),
    R.tap(context => (context.styles = styles[`${key}`](context)))
  )(({ resolution, geometry, mode }))
}
