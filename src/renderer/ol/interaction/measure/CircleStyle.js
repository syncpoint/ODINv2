import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import OlCircleGeom from 'ol/geom/Circle'
import { fromCircle } from 'ol/geom/Polygon'
import { Circle, Fill, Stroke, Style, Text } from 'ol/style'
import { FONT } from './baseStyle'
import {
  circleRadius,
  circleCircumference,
  circleArea,
  formatRadius,
  circumferenceFromRadius,
  areaFromRadius
} from './tools'

/**
 * @typedef {import('ol/geom/Circle').default} CircleGeom
 * @typedef {import('ol/geom/Point').default} PointGeom
 * @typedef {import('ol/style/Style').default} Style
 * @typedef {import('ol/coordinate').Coordinate} Coordinate
 */

/**
 * Style function for Circle geometry (used during drawing).
 * Creates styles for circle outline, center point (green), edge point (red),
 * radius line with label, and center label with area and circumference.
 * @param {CircleGeom} geometry - The Circle geometry to style
 * @param {boolean} [selected=false] - Whether the measurement is currently selected
 * @returns {Style[]} Array of OpenLayers Style objects
 */
export const CircleGeometry = (geometry, selected = false) => {
  /** @type {Style[]} */
  const styles = []
  /** @type {Coordinate} */
  const center = geometry.getCenter()
  const circlePolygon = fromCircle(geometry, 64)

  /* circle outline - primary stroke */
  styles.push(new Style({
    geometry: circlePolygon,
    stroke: new Stroke({
      color: selected ? 'blue' : 'red',
      width: 4
    })
  }))

  /* circle outline - dashed white overlay */
  styles.push(new Style({
    geometry: circlePolygon,
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }))

  /* center point marker (green - for panning) */
  styles.push(new Style({
    geometry: new Point(center),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: 'green'
      })
    })
  }))

  /* edge point marker (red - for changing radius) */
  const edgePoint = [center[0] + geometry.getRadius(), center[1]]
  styles.push(new Style({
    geometry: new Point(edgePoint),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: 'red'
      })
    })
  }))

  /* radius line with label */
  const radiusLine = new LineString([center, edgePoint])
  styles.push(new Style({
    geometry: radiusLine,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.3)',
      width: 2,
      lineDash: [5, 5]
    })
  }))

  styles.push(new Style({
    geometry: radiusLine,
    text: new Text({
      text: `r = ${circleRadius(geometry)}\n\n`,
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

  /* center label with area and circumference */
  styles.push(new Style({
    geometry: new Point(center),
    text: new Text({
      text: `${circleArea(geometry)}\n${circleCircumference(geometry)}`,
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
      textBaseline: 'bottom',
      offsetY: -15
    })
  }))

  return styles
}

/**
 * Style function for Point geometry with radius property (stored measurements).
 * Creates the same visual appearance as CircleGeometry but works with Point + radius.
 * @param {PointGeom} geometry - The Point geometry representing the circle center
 * @param {number} radiusMapUnits - The radius in map units
 * @param {boolean} [selected=false] - Whether the measurement is currently selected
 * @returns {Style[]} Array of OpenLayers Style objects
 */
export const PointCircle = (geometry, radiusMapUnits, selected = false) => {
  /** @type {Style[]} */
  const styles = []
  /** @type {Coordinate} */
  const center = geometry.getCoordinates()

  // Create a temporary circle geometry for visualization
  const tempCircle = new OlCircleGeom(center, radiusMapUnits)
  const circlePolygon = fromCircle(tempCircle, 64)

  /* circle outline - primary stroke */
  styles.push(new Style({
    geometry: circlePolygon,
    stroke: new Stroke({
      color: selected ? 'blue' : 'red',
      width: 4
    })
  }))

  /* circle outline - dashed white overlay */
  styles.push(new Style({
    geometry: circlePolygon,
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }))

  /* center point marker (green - for panning) */
  styles.push(new Style({
    geometry: new Point(center),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: 'green'
      })
    })
  }))

  /* edge point marker (red - for changing radius) */
  const edgePoint = [center[0] + radiusMapUnits, center[1]]
  styles.push(new Style({
    geometry: new Point(edgePoint),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: 'red'
      })
    })
  }))

  /* radius line with label */
  const radiusLine = new LineString([center, edgePoint])
  styles.push(new Style({
    geometry: radiusLine,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.3)',
      width: 2,
      lineDash: [5, 5]
    })
  }))

  styles.push(new Style({
    geometry: radiusLine,
    text: new Text({
      text: `r = ${formatRadius(center, radiusMapUnits)}\n\n`,
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

  /* center label with area and circumference */
  styles.push(new Style({
    geometry: new Point(center),
    text: new Text({
      text: `${areaFromRadius(center, radiusMapUnits)}\n${circumferenceFromRadius(center, radiusMapUnits)}`,
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
      textBaseline: 'bottom',
      offsetY: -15
    })
  }))

  return styles
}
