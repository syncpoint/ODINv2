import * as ol from 'ol'

export default async services => {
  const { sessionStore, emitter } = services
  const viewport = await sessionStore.get('viewport', sessionStore.DEFAULT_VIEWPORT)
  // const view = new ol.View({ ...viewport })
  const view = new ol.View({ projection: 'EPSG:32633' })

  view.on('change', ({ target: view }) => {
    sessionStore.put('viewport', {
      center: view.getCenter(),
      resolution: view.getResolution(),
      zoom: view.getZoom(),
      rotation: view.getRotation()
    })
  })

  emitter.on('map/flyto', ({ center }) => {
    const duration = 2000
    const zoom = view.getZoom()
    view.animate({ center, duration })
    view.animate(
      { zoom: zoom - 1, duration: duration / 2 },
      { zoom, duration: duration / 2 }
    )
  })

  emitter.on('map/goto', ({ center, resolution, rotation }) => {
    const duration = 1000
    view.animate({ center, resolution, rotation, duration })
  })

  return view
}
