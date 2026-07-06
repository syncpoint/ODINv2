import Signal from '@syncpoint/signal'
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style'
import CircleGeom from 'ol/geom/Circle'
import { toLonLat } from 'ol/proj'

const DEFAULT_RADIUS_M = 2500

const observerImage = selected => new CircleStyle({
  radius: selected ? 8 : 7,
  fill: new Fill({ color: 'rgba(0, 120, 220, 0.95)' }),
  stroke: new Stroke({ color: '#fff', width: selected ? 3 : 2 })
})

const rimStroke = selected => new Stroke({
  color: selected ? 'rgba(0, 120, 220, 0.9)' : 'rgba(0, 120, 220, 0.55)',
  width: selected ? 2.5 : 1.5,
  lineDash: [6, 8]
})

/**
 * Style orchestrator for Area-of-Sight features: observer point plus a
 * dashed rim at the analysis radius. The visibility raster itself is
 * rendered by the area-of-sight interaction's image layer.
 */
export default $ => Signal.link(
  (geometry, properties, mode) => {
    const selected = mode !== 'default'
    const center = geometry.getCoordinates()
    const radius = properties?.radius ?? DEFAULT_RADIUS_M
    const lat = toLonLat(center)[1] * Math.PI / 180
    const projected = radius / Math.max(0.087, Math.cos(lat))
    return [
      new Style({ stroke: rimStroke(selected), geometry: new CircleGeom(center, projected), zIndex: 1 }),
      new Style({ image: observerImage(selected), zIndex: 10 })
    ]
  },
  [$.geometry, $.properties, $.selectionMode]
)
