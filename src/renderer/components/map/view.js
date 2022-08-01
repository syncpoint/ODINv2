import * as ol from 'ol'

export default async services => {
  const { sessionStore, viewMemento, emitter } = services
  const viewport = await sessionStore.getViewport()
  const view = new ol.View({ ...viewport })
  view.on('change', ({ target: view }) => viewMemento.update(view))

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
