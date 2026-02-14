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
  const { services, map } = options
  const { preferencesStore } = services

  // Insert graticule above tile layers but below vector (feature) layers.
  const insertGraticule = (layer) => {
    const layers = map.getLayers()
    // Find the first vector layer (non-tile, non-graticule) and insert before it.
    let insertIndex = layers.getLength()
    for (let i = 0; i < layers.getLength(); i++) {
      const l = layers.item(i)
      if (l.getSource && l.getSource() && typeof l.getSource().getFeatures === 'function') {
        insertIndex = i
        break
      }
    }
    layers.insertAt(insertIndex, layer)
  }

  const type = await preferencesStore.get('graticule', null)
  let graticule = type ? createGraticule(type, map) : null
  if (graticule) insertGraticule(graticule)

  preferencesStore.on('graticuleChanged', ({ type, checked }) => {
    removeGraticule(graticule, map)
    graticule = null

    if (checked) {
      graticule = createGraticule(type, map)
      if (graticule) insertGraticule(graticule)
    }
  })
}
