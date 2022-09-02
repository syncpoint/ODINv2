import { Circle as CircleStyle, Fill, Stroke, Style, Text as TextStyle } from 'ol/style'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import GeometryType from './GeometryType'

import { angle, radiansAngle, length, getLastSegmentCoordinates, area } from './tools'

export const baseStyle = isSelected => [
  new Style({
    stroke: new Stroke({
      color: isSelected ? 'blue' : 'red',
      width: 4
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: 'blue'
      })
    })
  })
]

/* style function for POLYGON */
const polygonStyle = feature => {

  const styles = []
  const geometry = feature.getGeometry()

  const coordinates = geometry.getCoordinates()[0]
  const numberOfSegments = coordinates.length - 1

  for (let i = 0; i < numberOfSegments; i++) {
    const segment = new LineString([coordinates[i], coordinates[i + 1]])
    styles.push(new Style({
      geometry: segment,
      text: new TextStyle({
        text: `${length(segment)}\n\n`,
        font: '16px sans-serif',
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
  }

  styles.push(
    new Style({
      geometry: geometry.getInteriorPoint(),
      text: new TextStyle({
        text: `${area(geometry)}\n${length(geometry)}`,
        font: '16px sans-serif',
        fill: new Fill({
          color: 'black'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 5
        }),
        placement: 'point',
        overflow: true,
        textBaseline: 'ideographic'
      })
    })
  )

  return styles
}

/* style function for LINE_STRING */
const linestringStyle = feature => {

  const styles = []
  const geometry = feature.getGeometry()

  geometry.forEachSegment((start, end) => {
    const segment = new LineString([start, end])
    styles.push(new Style({
      geometry: segment,
      text: new TextStyle({
        text: `${length(segment)}\n\n${angle(segment)}`,
        font: '16px sans-serif',
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
    geometry: new Point(geometry.getFirstCoordinate()),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: 'green'
      })
    })
  }))

  const lastSegment = new LineString(getLastSegmentCoordinates(geometry))
  const alpha = radiansAngle(lastSegment)

  /* set style and label for last point */
  styles.push(
    new Style({
      geometry: new Point(geometry.getLastCoordinate()),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: 'red'
        })
      }),
      text: new TextStyle({
        text: length(geometry),
        font: '16px sans-serif',
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

export const stylist = (isSelected = false) => (feature) => {
  const geometry = feature.getGeometry()
  return stylefunctionForGeometryType(geometry.getType(), isSelected)(feature)
}

/* returns a style function for the given geometry type and selection state */
export const stylefunctionForGeometryType = (geometryType, isSelected = false) => {
  const styles = baseStyle(isSelected)

  if (geometryType === GeometryType.POLYGON) {
    return feature => [...styles, ...polygonStyle(feature)]
  } else if (geometryType === GeometryType.LINE_STRING) {
    return feature => [...styles, ...linestringStyle(feature)]
  }

  return () => {
    baseStyle()
  }
}
