import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'

/**
 *
 */
export const Map = () => {

  React.useEffect(async () => {
    const target = 'map'
    const controls = [new Rotate()]

    const defaultViewport = {
      center: [1823376.75753279, 6143598.472197734], // Vienna
      resolution: 612,
      rotation: 0
    }

    const view = new ol.View(defaultViewport)

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
