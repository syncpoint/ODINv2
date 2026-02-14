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

  const type = await preferencesStore.get('graticule', null)
  let graticule = type ? createGraticule(type, map) : null
  if (graticule) map.addLayer(graticule)

  preferencesStore.on('graticuleChanged', ({ type, checked }) => {
    removeGraticule(graticule, map)
    graticule = null

    if (checked) {
      graticule = createGraticule(type, map)
      if (graticule) map.addLayer(graticule)
    }
  })
}
