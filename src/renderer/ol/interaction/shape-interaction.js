import { Draw } from 'ol/interaction'
import uuid from '../../../shared/uuid'
import { writeFeatureObject } from '../../ol/format'
import GeometryType from './GeometryType'
import { militaryFormat } from '../../../shared/datetime'

/**
 * Draw interaction for shapes (lines and polygons without military semantics).
 * Similar to measure-interaction but creates features in the default layer
 * instead of standalone measurements.
 */
export default ({ map, services }) => {
  const { emitter, store } = services
  const ORIGINATOR_ID = uuid()

  let currentDraw = null

  const cancel = () => {
    if (!currentDraw) return
    currentDraw.abortDrawing()
    map.removeInteraction(currentDraw)
    currentDraw = null
  }

  const addDrawInteraction = (geometryType) => {
    cancel()
    emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })

    const drawInteraction = new Draw({ type: geometryType })

    drawInteraction.once('drawend', ({ feature }) => {
      cancel()
      const geoJSON = writeFeatureObject(feature)

      // Remove any SIDC — this is a plain shape
      delete geoJSON.properties?.sidc

      // Set a default name based on geometry type
      const typeName = geometryType === GeometryType.POLYGON ? 'Polygon' : 'Line'
      geoJSON.name = `${typeName} - ${militaryFormat.now()}`

      // Ensure properties exist but are clean (no military semantics)
      geoJSON.properties = {}

      // Insert as a regular feature in the default layer
      store.insertGeoJSON([geoJSON])
    })

    drawInteraction.once('drawabort', () => {
      cancel()
    })

    currentDraw = drawInteraction
    map.addInteraction(currentDraw)
    map.getTargetElement().focus()
  }

  emitter.on('DRAW_SHAPE_LINE', () => {
    addDrawInteraction(GeometryType.LINE_STRING)
  })

  emitter.on('DRAW_SHAPE_POLYGON', () => {
    addDrawInteraction(GeometryType.POLYGON)
  })

  emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) { cancel() }
  })
}
