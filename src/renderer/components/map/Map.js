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
import createSSELayers from './sseLayers'
import registerEventHandlers from './eventHandlers'
import registerGraticules from './graticules'
import measure from '../../ol/interaction/measure'
import shapeInteraction from '../../ol/interaction/shape-interaction'
import elevationProfile from '../../ol/interaction/elevation-profile'
import print from '../print'
import './Map.css'
import './ScaleLine.css'


/**
 *
 */
export const Map = () => {
  const services = useServices()
  const ref = React.useRef()

  const effect = async () => {
    const { preferencesStore } = services
    const view = await createMapView(services)
    const sources = await vectorSources(services)
    const styles = createLayerStyles(services, sources)
    const vectorLayers = createVectorLayers(sources, styles)

    const controlsTarget = document.getElementById('osd')
    const controls = [
      new Rotate({ target: controlsTarget }), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128, target: controlsTarget })
    ]

    const tileLayers = await createTileLayers(services)
    const sseLayers = await createSSELayers(services)
    const layers = [...tileLayers, ...sseLayers, ...Object.values(vectorLayers)]

    const qualityToPixelRatio = { full: undefined, balanced: 1.5, performance: 1 }
    const mapQuality = await preferencesStore.get('map.quality', 'balanced')
    const pixelRatio = qualityToPixelRatio[mapQuality]

    const map = new ol.Map({
      target: 'map',
      controls,
      layers,
      view,
      interactions: [],
      pixelRatio
    })

    preferencesStore.on('mapQualityChanged', ({ quality }) => {
      // pixelRatio can only be set at construction time, so we need to reload
      window.location.reload()
    })

    defaultInteractions({
      hitTolerance: 3,
      map,
      services,
      sources,
      styles
    })

    registerEventHandlers({ services, sources, vectorLayers, map })
    registerGraticules({ services, map, vectorLayers })
    print({ map, services })

    // Force map resize on container resize:
    const observer = new ResizeObserver(() => map.updateSize())
    observer.observe(ref.current)

    measure({ services, map })
    shapeInteraction({ services, map })
    elevationProfile({ services, map })

    // Expose a function to query the current map resolution.
    services.getMapResolution = () => map.getView().getResolution()
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    (async () => await effect())()
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return <div
    id='map'
    ref={ref}
    className='map'
    tabIndex='0'
  />
}
