import Graticule from 'ol/layer/Graticule'

export default async options => {
  const { services, map } = options
  const { preferencesStore } = services

  const type = await preferencesStore.get('graticule', null)
  let graticule = type
    ? type === 'WGS84'
      ? new Graticule({ showLabels: true, wrapX: false })
      : null
    : null

  if (graticule) map.addLayer(graticule)

  preferencesStore.on('graticuleChanged', ({ type, checked }) => {
    if (graticule) map.removeLayer(graticule)
    graticule = null

    if (checked) {
      graticule = type
        ? type === 'WGS84'
          ? new Graticule({ showLabels: true, wrapX: false })
          : null
        : null

      if (graticule) map.addLayer(graticule)
    }
  })
}
