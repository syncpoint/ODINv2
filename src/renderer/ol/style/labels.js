import * as R from 'ramda'
import { Jexl } from 'jexl'
import { Stroke, Style, Text } from 'ol/style'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import * as math from 'mathjs'

const jexl = new Jexl()

/**
 *
 */
const PolygonLabels = function (geometry, properties) {
  this.geometry = geometry
  this.properties = properties
  this.ring = this.geometry.getLinearRing(0)
  this.box = this.ring.getExtent()
  this.coords = this.ring.getCoordinates()
  this.center = this.geometry.getInteriorPoint()
  this.centerCoords = this.center.getCoordinates() // XYM layout
  this.footer = new geom.Point([this.centerCoords[0], this.box[1]])
}


/**
 * segmentIntersect :: ([x, y], [x, y]) -> [[x0, y0], [x1, y1]] -> [x, y]
 * Intersection point of two line segments yz and segment.
 * @private
 */
PolygonLabels.segmentIntersect = (y, z) => segment => {
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
 * @private
 */
PolygonLabels.axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => PolygonLabels.segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])


/**
 * @private
 */
PolygonLabels.prototype.topRightLeft = function () {
  const y = this.box[1] + (this.box[3] - this.box[1]) * 0.95
  const xs = PolygonLabels.axisIntersect(this.coords, [this.box[0], y], [this.box[2], y])

  if (xs.length !== 2) return
  this.topRight = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
  this.topLeft = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
}


/**
 * @private
 */
PolygonLabels.prototype.hIntersect = function () {
  const xs = PolygonLabels.axisIntersect(
    this.coords,
    [this.box[0], this.centerCoords[1]], [this.box[2], this.centerCoords[1]]
  )

  if (xs.length !== 2) return
  this.right = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
  this.left = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
}


/**
 * @private
 */
PolygonLabels.prototype.vIntersect = function () {
  const xs = PolygonLabels.axisIntersect(
    this.coords,
    [this.centerCoords[0], this.box[1]], [this.centerCoords[0], this.box[3]]
  )

  if (xs.length !== 2) return
  this.bottom = new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0])
  this.top = new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
}


/**
 * @private
 */
PolygonLabels.prototype.evaluate = function (position) {
  switch (position) {
    case 'topRight': return this.topRightLeft()
    case 'topLeft': return this.topRightLeft()
    case 'right': return this.hIntersect()
    case 'left': return this.hIntersect()
    case 'bottom': return this.vIntersect()
    case 'top': return this.vIntersect()
  }
}


/**
 *
 */
PolygonLabels.prototype.label = function (text) {
  if (!this[text.position]) this.evaluate(text.position)
  if (!this[text.position]) return null

  // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
  const fontSize = text.fontSize || '10pt'

  const lines = Array.isArray(text.text)
    ? text.text.map(text => jexl.evalSync(text, this.properties)).filter(R.identity).join('\n')
    : jexl.evalSync(text.text, this.properties)

  return new Style({
    geometry: this[text.position],
    text: new Text({
      text: lines,
      font: `${fontSize} sans-serif`,
      stroke: new Stroke({ color: 'white', width: 2 }),
      textAlign: text.align || 'center',
      offsetX: text.offsetX,
      offsetY: text.offsetY
    })
  })
}


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
const LineStringLabels = function (geometry, properties) {
  this.geometry = geometry
  this.properties = properties
  this.points = geometry.getCoordinates()
  this.segments = R.aperture(2, this.points)
}

const _TWO_PI = 2 * Math.PI
const _HALF_PI = Math.PI / 2
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const atan2 = delta => -1 * Math.atan2(delta[0], delta[1])
const normalizeAngle = x => x < 0 ? _TWO_PI + x : x
const segmentAngle = R.compose(normalizeAngle, atan2, vector)
const head = xs => xs[0]
const last = xs => xs[xs.length - 1]
const flip = α => α > _HALF_PI && α < 3 * _HALF_PI
const vAlign = v => ({ verticalAlign }) => verticalAlign === v
const hAlign = v => ({ textAlign }) => textAlign === v

export const LEFT = 'left'
export const START = 'start'
export const END = 'end'
export const RIGHT = 'right'
export const TOP = 'top'
export const MIDDLE = 'middle'
export const BOTTOM = 'bottom'

const textAlign = α => R.cond([
  [hAlign(LEFT), R.always(flip(α) ? 'end' : 'start')],
  [hAlign(END), R.always(flip(α) ? 'end' : 'start')],
  [hAlign(START), R.always(flip(α) ? 'start' : 'end')],
  [hAlign(RIGHT), R.always(flip(α) ? 'start' : 'end')],
  [R.T, R.always(null)]
])

const offsetX = α => R.cond([
  [hAlign(END), R.always(flip(α) ? -15 : 15)],
  [hAlign(START), R.always(flip(α) ? 15 : -15)],
  // [hAlign(LEFT), R.always(flip(α) ? -15 : 15)],
  // [hAlign(RIGHT), R.always(flip(α) ? 15 : -15)],
  [R.T, R.always(null)]
])

const offsetY = R.cond([
  [vAlign(TOP), R.always(-25)],
  [vAlign(BOTTOM), R.always(25)],
  [R.T, R.always(null)]
])


LineStringLabels.prototype.segment = function (fraction) {
  return [
    this.geometry.getCoordinateAt(fraction - 0.05),
    this.geometry.getCoordinateAt(fraction + 0.05)
  ]
}

LineStringLabels.prototype.alpha = function (text) {
  return R.cond([
    [hAlign(LEFT), R.always(segmentAngle(head(this.segments)))],
    [hAlign(START), R.always(segmentAngle(head(this.segments)))],
    [hAlign(END), R.always(segmentAngle(last(this.segments)))],
    [hAlign(RIGHT), R.always(segmentAngle(last(this.segments)))],
    [R.T, ({ textAlign }) => segmentAngle(this.segment(textAlign))]
  ])(text)
}

LineStringLabels.prototype.point = function (text) {
  return R.cond([
    [hAlign(LEFT), R.always(this.geometry.getFirstCoordinate())],
    [hAlign(START), R.always(this.geometry.getFirstCoordinate())],
    [hAlign(END), R.always(this.geometry.getLastCoordinate())],
    [hAlign(RIGHT), R.always(this.geometry.getLastCoordinate())],
    [R.T, ({ textAlign }) => this.geometry.getCoordinateAt(textAlign)]
  ])(text)
}


LineStringLabels.prototype.label = function (text) {
  const α = this.alpha(text)

  // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
  const fontSize = text.fontSize || '10pt'

  const lines = Array.isArray(text.text)
    ? text.text.map(text => jexl.evalSync(text, this.properties)).filter(R.identity).join('\n')
    : jexl.evalSync(text.text, this.properties)

  return new Style({
    geometry: new geom.Point(this.point(text)),
    text: new Text({
      text: lines,
      font: `${fontSize} sans-serif`,
      stroke: new Stroke({ color: 'white', width: 2 }),
      rotation: flip(α) ? α - Math.PI : α,
      textAlign: textAlign(α)(text),
      offsetX: offsetX(α)(text),
      offsetY: offsetY(text)
    })
  })

}

export const geometryLabels = (geometry, properties) => {
  const geometryType = geometry.getType()
  switch (geometryType) {
    case 'Polygon': return new PolygonLabels(geometry, properties)
    case 'LineString': return new LineStringLabels(geometry, properties)
    default: return null
  }
}
