import { Draw } from 'ol/interaction'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Circle from 'ol/geom/Circle'

import GeometryType from './GeometryType'

import { baseStyle, stylefunctionForGeometryType } from './style'
import { getLastSegmentCoordinates } from './tools'
import { militaryFormat } from '../../../../shared/datetime'
import { measurementId } from '../../../ids'
import { writeFeatureObject } from '../../../store/FeatureStore'

export default ({ map, services }) => {

  const source = new VectorSource()
  const vector = new VectorLayer({
    source/* ,
    style: stylist() */
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
      event.feature.setStyle(stylefunctionForGeometryType(geometryType, () => true))
      if (geometryType !== GeometryType.LINE_STRING) return

      /* circle helper is only supported when measuring distances */
      circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
      circleFeature.setStyle(baseStyle(true))
      source.addFeature(circleFeature)

      event.feature.on('change', handleLineStringChanged)
    })

    drawInteraction.on('drawend', event => {

      event.feature.setStyle(null)

      map.removeInteraction(drawInteraction)
      currentDrawInteraction = null

      const measurement = writeFeatureObject(event.feature)

      /*  event may be fired by ending the draw interaction with
          geometry LINE_STRING or POLYGON
      */
      if (geometryType === GeometryType.LINE_STRING) {
        /*  when drawing ends get rid of the circle fature */
        source.removeFeature(circleFeature)
        circleFeature.dispose()

        event.feature.un('change', handleLineStringChanged)

        measurement.name = `Distance - ${militaryFormat.now()}`
      } else {
        measurement.name = `Area - ${militaryFormat.now()}`
      }

      services.store.insert([[measurementId(), measurement]])
      setImmediate(() => source.removeFeature(event.feature))
    })

    return drawInteraction
  }

  // vector layer contains all measurement features
  map.addLayer(vector)

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

  services.emitter.on('MEASURE_BEARING_DISTANCE', () => {
    addDrawInteraction(GeometryType.LINE_STRING)
  })
  services.emitter.on('MEASURE_AREA', () => {
    addDrawInteraction(GeometryType.POLYGON)
  })
}
