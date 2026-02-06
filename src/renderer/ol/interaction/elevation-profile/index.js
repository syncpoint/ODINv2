import { Draw } from 'ol/interaction'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Stroke, Style, Fill, Circle as CircleStyle } from 'ol/style'
import { getLength } from 'ol/sphere'
import uuid from '../../../../shared/uuid'
import GeometryType from '../GeometryType'
import { ElevationService } from '../../../model/ElevationService'

const ORIGINATOR_ID = uuid()

const profileLineStyle = new Style({
  stroke: new Stroke({ color: 'rgba(255, 120, 0, 0.8)', width: 3 })
})

const hoverPointStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: 'rgba(255, 120, 0, 0.9)' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  })
})

/**
 * Find a LineString geometry from selected features on the map.
 * @param {import('ol/Map').default} map
 * @param {Array<string>} selectedIds
 * @returns {import('ol/geom/LineString').default|null}
 */
const findSelectedLineString = (map, selectedIds) => {
  if (selectedIds.length !== 1) return null

  const targetId = selectedIds[0]
  const layers = map.getLayerGroup().getLayersArray()

  for (const layer of layers) {
    if (typeof layer.getSource !== 'function') continue
    const source = layer.getSource()
    if (typeof source?.getFeatureById !== 'function') continue
    const feature = source.getFeatureById(targetId)
    if (!feature) continue
    const geom = feature.getGeometry()
    if (geom && geom.getType() === GeometryType.LINE_STRING) return geom
  }

  return null
}

/**
 * Compute geodesic distances at each interior vertex of a LineString.
 * These mark the boundaries between segments.
 */
const segmentBoundaryDistances = (geometry) => {
  const coords = geometry.getCoordinates()
  if (coords.length <= 2) return []

  const distances = []
  for (let i = 1; i < coords.length - 1; i++) {
    const partial = new LineString(coords.slice(0, i + 1))
    distances.push(getLength(partial))
  }
  return distances
}

export default ({ map, services }) => {
  const elevationService = new ElevationService()

  const source = new VectorSource()
  const vector = new VectorLayer({ source, style: null })
  map.addLayer(vector)

  let currentDrawInteraction = null
  let profileLineFeature = null
  let hoverPointFeature = null

  const cancel = () => {
    if (!currentDrawInteraction) return
    currentDrawInteraction.abortDrawing()
    map.removeInteraction(currentDrawInteraction)
    currentDrawInteraction = null
  }

  const clearOverlay = () => {
    source.clear()
    profileLineFeature = null
    hoverPointFeature = null
  }

  const showProfileLine = (geometry) => {
    clearOverlay()
    profileLineFeature = new Feature(geometry.clone())
    profileLineFeature.setStyle(profileLineStyle)
    source.addFeature(profileLineFeature)
  }

  const computeProfile = async (geometry) => {
    // Re-discover terrain source each time (layers may have changed)
    if (!elevationService.setSource(map)) {
      services.emitter.emit('osd', { message: 'No terrain layer available', cell: 'A3' })
      setTimeout(() => services.emitter.emit('osd', { message: '', cell: 'A3' }), 3000)
      return
    }

    const zoom = map.getView().getZoom()
    const lineLength = getLength(geometry)
    if (lineLength === 0) return

    // Determine resolution-appropriate sample count
    const tileGrid = elevationService.tileGrid_
    const z = Math.round(zoom)
    const tileResolution = tileGrid.getResolution(z)
    const pixelResolution = tileResolution / 256
    const numSamples = Math.min(600, Math.max(20, Math.round(lineLength / pixelResolution)))

    showProfileLine(geometry)

    const profile = await elevationService.profileAlongLine(geometry, numSamples, zoom)
    const segmentDistances = segmentBoundaryDistances(geometry)
    services.emitter.emit('elevation-profile/show', { profile, geometry, segmentDistances })
  }

  services.emitter.on('ELEVATION_PROFILE', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })

    // Check if a selected feature has LineString geometry
    const selectedIds = services.selection.selected()
    const lineGeom = findSelectedLineString(map, selectedIds)

    if (lineGeom) {
      computeProfile(lineGeom)
    } else {
      // Start draw interaction for a new line
      cancel()
      const drawInteraction = new Draw({
        type: GeometryType.LINE_STRING,
        source: new VectorSource() // throw-away source
      })

      drawInteraction.once('drawend', ({ feature }) => {
        map.removeInteraction(drawInteraction)
        currentDrawInteraction = null
        computeProfile(feature.getGeometry())
      })

      drawInteraction.once('drawabort', () => {
        map.removeInteraction(drawInteraction)
        currentDrawInteraction = null
      })

      currentDrawInteraction = drawInteraction
      map.addInteraction(drawInteraction)
    }
  })

  services.emitter.on('elevation-profile/hover', ({ coordinate }) => {
    if (!coordinate) {
      if (hoverPointFeature) {
        source.removeFeature(hoverPointFeature)
        hoverPointFeature = null
      }
      return
    }

    if (!hoverPointFeature) {
      hoverPointFeature = new Feature(new Point(coordinate))
      hoverPointFeature.setStyle(hoverPointStyle)
      source.addFeature(hoverPointFeature)
    } else {
      hoverPointFeature.getGeometry().setCoordinates(coordinate)
    }
  })

  services.emitter.on('elevation-profile/hide', () => {
    clearOverlay()
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) cancel()
  })
}
