import * as geom from 'ol/geom'
import { Fill, Stroke, Style, Text } from 'ol/style'
import { FONT } from './baseStyle'
import { length, area } from './tools'

export const Polygon = geometry => {

  const styles = []
  const coordinates = geometry.getCoordinates()[0]
  const numberOfSegments = coordinates.length - 1

  for (let i = 0; i < numberOfSegments; i++) {
    const segment = new geom.LineString([coordinates[i], coordinates[i + 1]])
    styles.push(new Style({
      geometry: segment,
      text: new Text({
        text: `${length(segment)}\n\n`,
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
  }

  styles.push(
    new Style({
      geometry: geometry.getInteriorPoint(),
      text: new Text({
        text: `${area(geometry)}\n${length(geometry)}`,
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
        textBaseline: 'ideographic'
      })
    })
  )

  return styles
}
