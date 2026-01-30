import { Draw } from 'ol/interaction'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Circle from 'ol/geom/Circle'
import uuid from '../../../../shared/uuid'
import GeometryType from '../GeometryType'
import { baseStyle } from './baseStyle'
import { styleFN } from './style'
import { getLastSegmentCoordinates } from './tools'
import { militaryFormat } from '../../../../shared/datetime'
import * as ID from '../../../ids'
import { writeFeatureObject } from '../../../ol/format'

/**
 * @typedef {import('ol/Map').default} Map
 * @typedef {import('ol/Feature').default} Feature
 * @typedef {import('ol/interaction/Draw').default} Draw
 * @typedef {import('ol/source/Vector').default} VectorSource
 * @typedef {import('ol/layer/Vector').default} VectorLayer
 * @typedef {Object} Services
 * @property {Object} emitter - Event emitter for inter-component communication
 * @property {Object} store - Data store for measurements
 */

/**
 * @typedef {Object} MeasureConfig
 * @property {Map} map - The OpenLayers map instance
 * @property {Services} services - Application services
 */

/**
 * @typedef {Object} DrawStartEvent
 * @property {Feature} feature - The feature being drawn
 */

/**
 * @typedef {Object} DrawEndEvent
 * @property {Feature} feature - The completed feature
 */

/**
 * @typedef {Object} FeatureChangeEvent
 * @property {Feature} target - The feature that changed
 */

/**
 * Initializes the measure interaction module.
 * Handles distance and area measurements with visual feedback.
 * @param {MeasureConfig} config - Configuration object with map and services
 * @returns {void}
 */
export default ({ map, services }) => {

  /** @type {string} */
  const ORIGINATOR_ID = uuid()

  /** @type {VectorSource} */
  const source = new VectorSource()
  /** @type {VectorLayer} */
  const vector = new VectorLayer({ source })

  /*  circle feature is is used for giving the user a visual feedback for the last segement of
      the distance measurement
  */
  /** @type {Feature|null} */
  let circleFeature
  /** @type {Draw|null} */
  let currentDrawInteraction

  /**
   * Cancels the current draw interaction and cleans up resources.
   * @returns {void}
   */
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

  /**
   * Updates the circle feature to visualize the last segment during distance measurement.
   * @param {FeatureChangeEvent} event - The feature change event
   * @returns {void}
   */
  const applyToCircleFeature = ({ target }) => {
    const lineStringGeometry = target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  /**
   * Creates a new Draw interaction for the specified geometry type.
   * Sets up event handlers for draw start, end, and abort.
   * @param {string} geometryType - The geometry type to draw (LINE_STRING or POLYGON)
   * @returns {Draw} The configured Draw interaction
   */
  const createDrawInteraction = (geometryType) => {
    const drawInteraction = new Draw({
      type: geometryType,
      source,
      style: baseStyle(true)
    })

    drawInteraction.once('drawstart', ({ feature }) => {
      feature.setStyle(styleFN(() => true))
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

      services.store.insert([[ID.measureId(), measurement]])
      setImmediate(() => source.removeFeature(feature))
    })

    drawInteraction.once('drawabort', ({ feature }) => {
      feature.un('change', applyToCircleFeature)
    })

    return drawInteraction
  }

  // vector layer contains all measurement features
  map.addLayer(vector)

  /**
   * Adds a new Draw interaction for the specified geometry type.
   * Cancels any existing draw interaction before adding the new one.
   * @param {string} geometryType - The geometry type to draw (LINE_STRING or POLYGON)
   * @returns {void}
   */
  const addDrawInteraction = geometryType => {
    cancel()
    /* gets removed when drawing ends */
    currentDrawInteraction = createDrawInteraction(geometryType)
    map.addInteraction(currentDrawInteraction)
  }

  services.emitter.on('MEASURE_DISTANCE', () => {
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
