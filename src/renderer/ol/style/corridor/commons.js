import * as R from 'ramda'
import * as TS from '../ts'
import { codeUTM } from '../../../epsg'

// TODO: replace with TS.projectCoordinate
export const arrowCoordinates = (width, line, offset = 1) => {
  const coordinates = R.last(R.aperture(2, TS.coordinates([line])))
  const segment = TS.segment(coordinates)
  const angle = segment.angle()
  const p = coordinates[offset]
  return xs => xs
    .map(([dx, dy]) => [-dx * width, dy * width])
    .map(([dx, dy]) => [Math.sqrt(dx * dx + dy * dy), angle - Math.atan2(dy, dx)])
    .map(([c, α]) => new TS.Coordinate(p.x + Math.cos(α) * c, p.y + Math.sin(α) * c))
}

const arrowPoints = (resolution, angle, point) =>
  TS.projectCoordinates(resolution * 8, angle, point)([[-1, 0.6], [0, 0], [-1, -0.6]])

export const openArrow = (resolution, angle, point) =>
  TS.lineString(R.props([0, 1, 2], arrowPoints(resolution, angle, point)))

export const closedArrow = (resolution, angle, point) =>
  TS.polygon(R.props([0, 1, 2, 0], arrowPoints(resolution, angle, point)))

/**
 * Decorate existing style function with these cross-cutting concerns:
 * - in/call: project from web mercator to UTM (feature/geometry)
 * - in/call: convert feature geometry from OpenLayers to (J)TS
 * - in/call: extract and forwards line string, point and (corridor) width
 * - out/return: convert style geometry from (J)TS to OpenLayers
 * - out/return: project UTM to web mercator
 *
 * @param {function} fn original style function
 */
export const transform = fn => args => {
  const geometry = args.feature.getGeometry()
  const code = codeUTM(geometry)
  const clone = geometry.clone().transform('EPSG:3857', code)
  const [lineString, point] = TS.geometries(TS.read(clone))
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()

  return fn({ ...args, lineString, point, width })
    .flat()
    .map(style => {
      const geometry = TS.write(style.getGeometry())
      style.setGeometry(geometry.transform(code, 'EPSG:3857'))
      return style
    })
}