import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import * as Registry from '../registry'

/**
 *
 */
export const Map = () => {

  React.useEffect(async () => {
    const session = Registry.get(Registry.SESSION)
    const viewport = await session.getViewport({
      center: [1823376.75753279, 6143598.472197734], // Vienna
      resolution: 612,
      rotation: 0
    })

    const target = 'map'
    const controls = [new Rotate()]

    const view = new ol.View(viewport)
    view.on('change', ({ target: view }) => {
      session.putViewport({
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })

    const layers = [
      new TileLayer({ source: new OSM() })
    ]

    /* eslint-disable no-new */
    new ol.Map({
      target,
      controls,
      layers,
      view,
      interactions: defaultInteractions({
        doubleClickZoom: false
      })
    })
  }, [])

  return <div
    id='map'
    className='map fullscreen'
    tabIndex='0'
  >
  </div>
}
