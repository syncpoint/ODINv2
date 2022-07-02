import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { ScaleLine, Rotate } from 'ol/control'
import '../../epsg'
import { useServices } from '../hooks'
import defaultInteractions from '../../ol/interaction'
import vectorSources from './vectorSources'
import createMapView from './view'
import createLayerStyles from './layerStyles'
import createVectorLayers from './vectorLayers'
import createTileLayers from './tileLayers'
import registerEventHandlers from './eventHandlers'
import registerGraticules from './graticules'
import './Map.css'

/**
 *
 */
export const Map = () => {
  const services = useServices()

  const effect = async () => {
    const view = await createMapView(services)
    const sources = vectorSources(services)
    const styles = createLayerStyles(services, sources)
    const vectorLayers = createVectorLayers(sources, styles)

    const controlsTarget = document.getElementById('map-controls')
    const controls = [
      new Rotate({ target: controlsTarget }), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128, target: controlsTarget })
    ]

    const map = new ol.Map({
      target: 'map',
      controls,
      layers: [...createTileLayers(), ...Object.values(vectorLayers)],
      view,
      interactions: []
    })

    defaultInteractions({
      hitTolerance: 3,
      map,
      services,
      sources,
      styles
    })

    registerEventHandlers({ services, sources, vectorLayers, map })
    registerGraticules({ services, map })
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    (async () => await effect())()
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return <div
    id='map'
    className='map fullscreen'
    tabIndex='0'
  />
}
