import Graticule from 'ol/layer/Graticule'
import { createMGRSGraticule } from './mgrsGraticule'

const createGraticule = (type, map) => {
  if (type === 'WGS84') return new Graticule({ showLabels: true, wrapX: false })
  if (type === 'MGRS') return createMGRSGraticule(map)
  return null
}

const removeGraticule = (graticule, map) => {
  if (!graticule) return
  const cleanup = graticule.get && graticule.get('_mgrsCleanup')
  if (cleanup) cleanup()
  map.removeLayer(graticule)
}

export default async options => {
  const { services, map, vectorLayers } = options
  const { preferencesStore } = services

  // Insert graticule below the first vector (feature) layer.
  const addGraticule = (layer) => {
    const layers = map.getLayers()
    const firstVectorLayer = vectorLayers && Object.values(vectorLayers)[0]
    if (firstVectorLayer) {
      const idx = layers.getArray().indexOf(firstVectorLayer)
      if (idx >= 0) {
        layers.insertAt(idx, layer)
        return
      }
    }
    map.addLayer(layer)
  }

  const type = await preferencesStore.get('graticule', null)
  let graticule = type ? createGraticule(type, map) : null
  if (graticule) addGraticule(graticule)

  preferencesStore.on('graticuleChanged', ({ type, checked }) => {
    removeGraticule(graticule, map)
    graticule = null

    if (checked) {
      graticule = createGraticule(type, map)
      if (graticule) addGraticule(graticule)
    }
  })
}
