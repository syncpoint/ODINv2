import { Draw } from 'ol/interaction'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Circle from 'ol/geom/Circle'
import uuid from 'uuid-random'
import GeometryType from './GeometryType'
import { baseStyle, stylefunctionForGeometryType } from './style'
import { getLastSegmentCoordinates } from './tools'
import { militaryFormat } from '../../../../shared/datetime'
import * as ID from '../../../ids'
import { writeFeatureObject } from '../../../store/FeatureStore'

export default ({ map, services }) => {

  const ORIGINATOR_ID = uuid()

  const source = new VectorSource()
  const vector = new VectorLayer({ source })

  /*  circle feature is is used for giving the user a visual feedback for the last segement of
      the distance measurement
  */
  let circleFeature
  let currentDrawInteraction

  const cancel = () => {
    if (!currentDrawInteraction) return

    if (circleFeature) {
      source.removeFeature(circleFeature)
      circleFeature.dispose()
      circleFeature = null
    }

    currentDrawInteraction.abortDrawing()
    map.removeInteraction(currentDrawInteraction)
    currentDrawInteraction = null
  }

  const applyToCircleFeature = ({ target }) => {
    const lineStringGeometry = target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  /*  ** DRAW ** */
  const createDrawInteraction = (geometryType) => {
    const drawInteraction = new Draw({
      type: geometryType,
      source,
      style: baseStyle(true)
    })

    drawInteraction.once('drawstart', ({ feature }) => {
      feature.setStyle(stylefunctionForGeometryType(geometryType, () => true))
      if (geometryType !== GeometryType.LINE_STRING) return

      /* circle helper is only supported when measuring distances */
      circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
      circleFeature.setStyle(baseStyle(true))
      source.addFeature(circleFeature)

      feature.on('change', applyToCircleFeature)
    })

    drawInteraction.once('drawend', ({ feature }) => {
      feature.setStyle(null)
      cancel()

      const measurement = writeFeatureObject(feature)

      if (geometryType === GeometryType.LINE_STRING) {
        feature.un('change', applyToCircleFeature)
        measurement.name = `Distance - ${militaryFormat.now()}`
      } else {
        measurement.name = `Area - ${militaryFormat.now()}`
      }

      services.store.insert([[ID.measurementId(), measurement]])
      setImmediate(() => source.removeFeature(feature))
    })

    drawInteraction.once('drawabort', ({ feature }) => {
      feature.un('change', applyToCircleFeature)
    })

    return drawInteraction
  }

  // vector layer contains all measurement features
  map.addLayer(vector)

  const addDrawInteraction = geometryType => {
    cancel()
    /* gets removed when drawing ends */
    currentDrawInteraction = createDrawInteraction(geometryType)
    map.addInteraction(currentDrawInteraction)
  }

  services.emitter.on('MEASURE_BEARING_DISTANCE', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    addDrawInteraction(GeometryType.LINE_STRING)
  })
  services.emitter.on('MEASURE_AREA', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    addDrawInteraction(GeometryType.POLYGON)
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) { cancel() }
  })
}
