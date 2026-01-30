import * as geom from 'ol/geom'
import { Circle, Fill, Stroke, Style, Text } from 'ol/style'
import { FONT } from './baseStyle'
import { angle, radiansAngle, length, getLastSegmentCoordinates } from './tools'

/**
 * @typedef {import('ol/geom/LineString').default} LineStringGeometry
 * @typedef {import('ol/style/Style').default} Style
 * @typedef {import('ol/coordinate').Coordinate} Coordinate
 */

/**
 * Creates styles for LineString measurement geometries.
 * Displays length and bearing angle labels on each segment,
 * a green circle at the start point, and a red circle at the end point
 * with the total distance (if more than one segment).
 * @param {LineStringGeometry} geometry - The LineString geometry to style
 * @returns {Style[]} Array of OpenLayers Style objects
 */
export const LineString = geometry => {
  /** @type {Style[]} */
  const styles = []
  let numberOfSegments = 0

  geometry.forEachSegment((start, end) => {
    const segment = new geom.LineString([start, end])
    numberOfSegments++
    styles.push(new Style({
      geometry: segment,
      text: new Text({
        text: `${length(segment)}\n\n${angle(segment)}`,
        font: FONT,
        fill: new Fill({
          color: 'black'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 5
        }),
        placement: 'line',
        overflow: true,
        textBaseline: 'middle'
      })
    }))
  })

  /* first point of the linestring */
  styles.push(new Style({
    geometry: new geom.Point(geometry.getFirstCoordinate()),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: 'green'
      })
    })
  }))

  const lastSegment = new geom.LineString(getLastSegmentCoordinates(geometry))
  const alpha = radiansAngle(lastSegment)

  /* set style and label for last point but only if we have more than one segment */

  styles.push(
    new Style({
      geometry: new geom.Point(geometry.getLastCoordinate()),
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: 'red'
        })
      }),
      text: (numberOfSegments === 1)
        ? ''
        : new Text({
          text: length(geometry),
          font: FONT,
          fill: new Fill({
            color: 'black'
          }),
          stroke: new Stroke({
            color: 'white',
            width: 5
          }),
          offsetX: 25 * Math.cos(alpha),
          offsetY: -25 * Math.sin(alpha),
          placement: 'point',
          textAlign: Math.abs(alpha) < Math.PI / 2 ? 'left' : 'right',
          overflow: true,
          textBaseline: 'ideographic'
        })
    })
  )

  return styles
}
