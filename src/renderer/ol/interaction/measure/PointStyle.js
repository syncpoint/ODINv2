import * as geom from 'ol/geom'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import { FONT } from './baseStyle'
import { formatRadius, circumferenceFromRadius, areaFromRadius } from './tools'

/**
 * @typedef {import('ol/geom/Point').default} PointGeometry
 * @typedef {import('ol/style/Style').default} Style
 * @typedef {import('ol/Feature').default} Feature
 */

/**
 * Creates a circle geometry from a Point and radius property for styling purposes.
 * @param {PointGeometry} pointGeometry - The Point geometry (center)
 * @param {number} radius - The radius in map units
 * @returns {import('ol/geom/Circle').default} Circle geometry for rendering
 */
const createCircleGeometry = (pointGeometry, radius) => {
  const center = pointGeometry.getCoordinates()
  return new geom.Circle(center, radius)
}

/**
 * Creates styles for Point measurement geometries with radius property (circle measures).
 * Displays a rendered circle with green center handle, red edge handle,
 * and radius/area/circumference labels.
 * @param {PointGeometry} geometry - The Point geometry (center of circle)
 * @param {Feature} feature - The feature containing the radius property
 * @param {boolean} [selected=false] - Whether the feature is selected
 * @returns {Style[]} Array of OpenLayers Style objects
 */
export const Point = (geometry, feature, selected = false) => {
  const radius = feature?.get('radius')
  if (!radius) return []

  const center = geometry.getCoordinates()
  const circleGeometry = createCircleGeometry(geometry, radius)
  const edgeCoordinate = [center[0] + radius, center[1]]

  /** @type {Style[]} */
  const styles = []

  // Circle stroke - blue when selected, red when not (matches baseStyle)
  styles.push(new Style({
    geometry: circleGeometry,
    stroke: new Stroke({
      color: selected ? 'blue' : 'red',
      width: 4
    })
  }))

  styles.push(new Style({
    geometry: circleGeometry,
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }))

  // Green center handle
  styles.push(new Style({
    geometry: new geom.Point(center),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: 'green'
      })
    })
  }))

  // Red edge handle
  styles.push(new Style({
    geometry: new geom.Point(edgeCoordinate),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: 'red'
      })
    })
  }))

  // Radius label on edge
  styles.push(new Style({
    geometry: new geom.Point(edgeCoordinate),
    text: new Text({
      text: `r = ${formatRadius(center, radius)}`,
      font: FONT,
      fill: new Fill({
        color: 'black'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 5
      }),
      offsetX: 30,
      offsetY: 0,
      textAlign: 'left',
      overflow: true
    })
  }))

  // Area and circumference label at center
  styles.push(new Style({
    geometry: new geom.Point(center),
    text: new Text({
      text: `${areaFromRadius(center, radius)}\n${circumferenceFromRadius(center, radius)}`,
      font: FONT,
      fill: new Fill({
        color: 'black'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 5
      }),
      placement: 'point',
      overflow: true,
      textBaseline: 'top',
      offsetY: 15
    })
  }))

  return styles
}
