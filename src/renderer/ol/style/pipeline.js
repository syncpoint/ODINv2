import * as R from 'ramda'
import { Jexl } from 'jexl'
import * as AF from 'transformation-matrix' // affine transformations
import * as TS from '../ts'
import { PI_OVER_2 } from '../../../shared/Math'
import { transform, geometryType } from '../geometry'
import { makeStyles, Props } from './styles'
import { parameterized, echelonCode } from '../../symbology/2525c'
import echelons from './echelons.json'
import { smooth } from './chaikin'

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

  return {
    anchorPoint: anchor => positions[anchor](),
    angle: () => null
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

const labelAnchors = ({ styles, geometry }) => {
  const normalize = angle => TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle)
  const nullAnchors = () => ({ anchorPoint: () => null, angle: () => null })
  const factories = {
    Polygon: polygonAnchors,
    LineString: lineStringAnchors
  }

  const geometryType = geometry.getGeometryType()
  const factory = (factories[geometryType] || nullAnchors)(geometry)

  return styles.map(label => {
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
}

const jexl = new Jexl()

const labelTexts = (properties, styles) => {
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

const handles = context => {
  const { styles, mode, simplifiedGeometry, simplified } = context
  if (simplified && mode !== 'multiple') return
  if (!handleStyles[mode]) return

  const points = () => {
    switch (mode) {
      case 'selected': return TS.multiPoint(TS.points(simplifiedGeometry))
      case 'multiple': return TS.points(simplifiedGeometry)[0]
    }
  }

  styles.push({ id: handleStyles[mode], geometry: points() })
}

const guideLines = context => {
  const { styles, mode, simplified, simplifiedGeometry } = context
  if (simplified) return
  if (mode !== 'selected') return
  styles.push({ id: 'style:guide-stroke', geometry: simplifiedGeometry })
}

const readGeometry = context => {
  const { feature, resolution } = context

  const geometry = feature.getGeometry()
  const { read, write } = transform(geometry)
  context.read = read
  context.write = write
  context.geometryType = geometryType(geometry)
  context.properties = feature.getProperties()

  context.simplified = context.geometryType === 'Polygon'
    ? geometry.getCoordinates()[0].length > 50
    : context.geometryType === 'LineString'
      ? geometry.getCoordinates().length > 50
      : false

  const simplifiedGeometry = context.simplified
    ? geometry.simplify(resolution)
    : geometry

  context.smoothed = feature.get('style') && feature.get('style').smooth
  const smoothedGeometry = context.smoothed
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  context.geometry = read(smoothedGeometry)
  context.simplifiedGeometry = context.smoothed
    ? read(simplifiedGeometry)
    : context.geometry
}

const writeGeometries = context => {
  context.styles = context.styles.map(style => ({ ...style, geometry: context.write(style.geometry) }))
}

const labelEchelon = context => {
  const icon = context.styles.find(label => Props.iconImage(label))
  if (!icon) return

  const code = echelonCode(context.properties.sidc)
  const echelon = echelons[code]
  if (!echelon) return

  icon['icon-height'] = echelon.height
  icon['icon-width'] = echelon.width
  icon['icon-url'] = echelon.url
  icon['icon-scale'] = 0.15
}

export const pipeline = (styles, { feature, resolution, mode }) => {
  return R.compose(
    ({ feature, styles, mode }) => {
      const styleFactory = makeStyles(feature, mode)
      return styles.map(styleFactory.makeStyle)
    },
    R.tap(writeGeometries),
    R.tap(guideLines),
    R.tap(handles),
    R.tap(clipLabels),
    R.tap(labelEchelon),
    R.tap(context => (context.styles = labelTexts(context.properties, context.styles))),
    R.tap(context => (context.styles = labelAnchors(context))),
    R.tap(context => context.styles.push(...(styles[`LABELS:${context.sidc}`] || []).flat())),
    R.tap(context => {
      const { geometryType } = context
      const sidc = parameterized(feature.get('sidc'))
      const key = styles[`${geometryType}:${sidc}`]
        ? `${geometryType}:${sidc}`
        : `${geometryType}:DEFAULT`

      context.sidc = sidc
      context.styles = styles[`${key}`](context)
    }),
    R.tap(readGeometry)
  )(({ feature, resolution, mode }))
}
