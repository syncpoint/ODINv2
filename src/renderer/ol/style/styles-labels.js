import * as R from 'ramda'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import { Jexl } from 'jexl'
import * as math from 'mathjs'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

const jexl = new Jexl()
const atan2 = delta => Math.atan2(delta[0], delta[1])
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const segmentAngle = R.compose(atan2, vector)
const isAlign = v => ({ align }) => align === v

const textAlign = {
  left: 'end',
  right: 'start',
  start: 'start',
  end: 'end',
  center: 'center'
}

const offsetX = { start: 15, end: -15 }

const text = (properties, { text }) => Array.isArray(text)
  ? text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
  : jexl.evalSync(text, properties)


/**
 * Horizontal and vertical label placement
 *
 * vertical/horizontal
 *
 *                 LEFT  START      <-- FRACTION -->    END  RIGHT
 * TOP                |  |                 |              |  |
 *                    |  |                 |              |  |
 * MIDDLE             |  +-----------------|--------------+  |
 *                    |  P1                |              P2 |
 * BOTTOM             |  |                 |              |  |
 */
const lineString = (geometry, properties, styles) => {
  const segments = R.aperture(2, geometry.getCoordinates())

  const segment = fraction => [
    geometry.getCoordinateAt(fraction - 0.05),
    geometry.getCoordinateAt(fraction + 0.05)
  ]

  const angle = R.cond([
    [isAlign('right'), R.always(segmentAngle(R.head(segments)))],
    [isAlign('end'), R.always(segmentAngle(R.head(segments)))],
    [isAlign('start'), R.always(segmentAngle(R.last(segments)))],
    [isAlign('left'), R.always(segmentAngle(R.last(segments)))],
    [R.T, ({ align }) => segmentAngle(segment(align))]
  ])

  const coordinate = R.cond([
    [isAlign('end'), R.always(geometry.getFirstCoordinate())],
    [isAlign('right'), R.always(geometry.getFirstCoordinate())],
    [isAlign('start'), R.always(geometry.getLastCoordinate())],
    [isAlign('left'), R.always(geometry.getLastCoordinate())],
    [R.T, ({ align }) => geometry.getCoordinateAt(align)]
  ])

  const textOptions = label => {
    context.font = styles.font(label)

    const options = {
      text: text(properties, label),
      angle: angle(label),
      textAlign: textAlign[label.align] || null,
      offsetY: label.offsetY || 0,
      offsetX: offsetX[label.align] || 0
    }

    return {
      textOptions: options,
      metrics: context.measureText(options.text)
    }
  }

  return labels => {
    if (!labels || !labels.length) return []

    const textLabels = labels.filter(({ text }) => text)
    const options = textLabels.map(label => ({
      geometry: new geom.Point(coordinate(label)),
      ...textOptions(label)
    }))

    return options
  }
}


/**
 *
 */
const polygon = (geometry, properties, styles) => {
  const ring = geometry.getLinearRing(0)
  const box = ring.getExtent()
  const coords = ring.getCoordinates()

  const positions = {}
  positions.center = geometry.getInteriorPoint()
  const centerCoords = positions.center.getCoordinates() // XYM layout
  positions.footer = new geom.Point([centerCoords[0], box[1]])


  /**
   * segmentIntersect :: ([x, y], [x, y]) -> [[x0, y0], [x1, y1]] -> [x, y]
   * Intersection point of two line segments yz and segment.
   */
  const segmentIntersect = (y, z) => segment => {
    const intersection = math.intersect(segment[0], segment[1], y, z)
    if (!intersection) return []
    const extent = new geom.LineString(segment).getExtent()
    if (!containsXY(extent, intersection[0], intersection[1])) return []
    return [intersection]
  }

  /**
   * axisIntersect :: ([[x, y]], [x, y], [x, y]) -> [[x, y]] -> [[x, y]]
   * Maximum of two intersection points of line segment yz
   * with all segments formed by points.
   */
  const axisIntersect = (points, y, z) => R
    .aperture(2, points)
    .map(segment => segmentIntersect(y, z)(segment))
    .reduce((acc, intersections) => acc.concat(intersections), [])

  const topRightLeft = function () {
    const y = box[1] + (box[3] - box[1]) * 0.95
    const xs = axisIntersect(coords, [box[0], y], [box[2], y])

    if (xs.length !== 2) return
    positions.topRight = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
    positions.topLeft = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
  }

  const hIntersect = function () {
    const xs = axisIntersect(
      coords,
      [box[0], centerCoords[1]], [box[2], centerCoords[1]]
    )

    if (xs.length !== 2) return
    positions.right = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
    positions.left = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
  }

  const vIntersect = function () {
    const xs = axisIntersect(
      coords,
      [centerCoords[0], box[1]], [centerCoords[0], box[3]]
    )

    if (xs.length !== 2) return
    positions.bottom = new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0])
    positions.top = new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
  }

  const calculate = ({ position }) => {
    switch (position) {
      case 'topRight': return topRightLeft()
      case 'topLeft': return topRightLeft()
      case 'left': return hIntersect()
      case 'right': return hIntersect()
      case 'top': return vIntersect()
      case 'bottom': return vIntersect()
    }
  }

  const textOptions = label => {
    context.font = styles.font(label)

    const options = {
      text: text(properties, label),
      textAlign: label.textAlign,
      offsetY: label.offsetY,
      offsetX: label.offsetX
    }

    return {
      textOptions: options,
      metrics: context.measureText(options.text)
    }
  }

  const symbolOptions = label => ({
    sidc: label.sidc
  })

  return labels => {
    if (!labels || !labels.length) return []

    return labels.map(label => {
      if (!positions[label.position]) calculate(label.position)
      if (!positions[label.position]) return null
      const geometry = positions[label.position]

      return label.text
        ? { geometry, ...textOptions(label) }
        : { geometry, symbolOptions: symbolOptions(label) }
    })
  }
}

export const styleOptions = (geometry, properties, styles) =>
  geometry.getType() === 'LineString'
    ? lineString(geometry, properties, styles)
    : polygon(geometry, properties, styles)
