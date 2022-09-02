import { Draw, Modify, Select } from 'ol/interaction'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'

import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Circle from 'ol/geom/Circle'

import GeometryType from './GeometryType'
import uuid from 'uuid-random'

import { stylist, baseStyle, stylefunctionForGeometryType } from './style'
import { getLastSegmentCoordinates } from './tools'

export default ({ map, services }) => {

  /*  initialize OL container that will hold our
      measurement features
  */
  const selectedFeatures = new Collection()

  const source = new VectorSource()
  const vector = new VectorLayer({
    source,
    style: stylist()
  })

  /*  ** SELECT ** */
  const selectionInteraction = new Select({
    hitTolerance: 3,
    layers: [vector],
    features: selectedFeatures,
    style: stylist(true),
    filter: feature => (
      feature.getGeometry().getType() === GeometryType.LINE_STRING ||
      feature.getGeometry().getType() === GeometryType.POLYGON
    )
  })

  /*  ** MODIFY ** */
  const modifyInteraction = new Modify({
    features: selectedFeatures
  })

  /*  circle feature is is used for giving the user a visual feedback for the last segement of
      the distance measurement
  */
  let circleFeature

  /* reference to the current draw interaction */
  let currentDrawInteraction

  const handleLineStringChanged = event => {
    const lineStringGeometry = event.target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  /*  ** DRAW ** */
  const createDrawInteraction = (map, geometryType) => {
    const drawInteraction = new Draw({
      type: geometryType,
      source,
      style: baseStyle(true)
    })

    drawInteraction.on('drawstart', event => {
      event.feature.setStyle(stylefunctionForGeometryType(geometryType, true))
      if (geometryType !== GeometryType.LINE_STRING) return

      /* circle helper is only supported when measuring distances */
      circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
      circleFeature.setStyle(baseStyle(true))
      source.addFeature(circleFeature)

      event.feature.on('change', handleLineStringChanged)
    })

    drawInteraction.on('drawend', event => {

      /*  schema:id is required in order to make deleting a feature work */
      event.feature.setId(`measure:${uuid()}`)
      event.feature.setStyle(null)

      map.removeInteraction(drawInteraction)
      currentDrawInteraction = null

      /*  event my be fired by ending the draw interaction with
          geometry LINE_STRING or POLYGON
      */
      if (geometryType !== GeometryType.LINE_STRING) return

      /*  when drawing ends get rid of the circle fature */
      source.removeFeature(circleFeature)
      circleFeature.dispose()

      event.feature.un('change', handleLineStringChanged)
    })

    return drawInteraction
  }

  // vector layer contains all measurement features
  map.addLayer(vector)
  map.addInteraction(modifyInteraction)
  map.addInteraction(selectionInteraction)

  const addDrawInteraction = geometryType => {
    /* make this idempotent */
    if (currentDrawInteraction && map.getInteractions().getArray().includes(currentDrawInteraction)) {
      map.removeInteraction(currentDrawInteraction)
      currentDrawInteraction = null
    }
    /* gets removed when drawing ends */
    currentDrawInteraction = createDrawInteraction(map, geometryType)
    map.addInteraction(currentDrawInteraction)
  }

  services.emitter.on('MAP_MEASURE_LENGTH', () => {
    addDrawInteraction(GeometryType.LINE_STRING)
  })

  services.emitter.on('command/delete', () => {
    console.log('should delete ...')
    selectedFeatures.getArray().forEach(feature => source.removeFeature(feature))
    selectedFeatures.clear()
  })
  /*
  evented.on('MAP_MEASURE_AREA', () => {
    addDrawInteraction(GeometryType.POLYGON)
  }) */
}
