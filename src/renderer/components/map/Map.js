import React from 'react'
import Signal from '@syncpoint/signal'
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
import measure from '../../ol/interaction/measure'
import print from '../print'
import './Map.css'
import './ScaleLine.css'


/**
 *
 */
export const Map = () => {
  const services = useServices()
  const ref = React.useRef()
  const symbolPropertiesShowing = React.useMemo(() => Signal.of(true), [])

  React.useEffect(() => {
    const key = 'ui.symbolProperties.showing'

    ;(async () => {
      const showing = await services.preferencesStore.get(key, true)
      symbolPropertiesShowing(showing)
    })()

    const handle = ({ value }) => symbolPropertiesShowing(value)
    services.preferencesStore.on(key, handle)

    return () => services.preferencesStore.off(key, handle)
  }, [services.preferencesStore, symbolPropertiesShowing])

  React.useEffect(() => {
    let map

    ;(async () => {
      const view = await createMapView(services)
      const sources = await vectorSources({ ...services, symbolPropertiesShowing })
      const styles = createLayerStyles(services, sources)
      const vectorLayers = createVectorLayers(sources, styles)

      const controlsTarget = document.getElementById('osd')
      const controls = [
        new Rotate({ target: controlsTarget }), // macOS: OPTION + SHIFT + DRAG
        new ScaleLine({ bar: true, text: true, minWidth: 128, target: controlsTarget })
      ]

      const tileLayers = await createTileLayers(services)
      const layers = [...tileLayers, ...Object.values(vectorLayers)]

      map = new ol.Map({
        target: 'map',
        controls,
        layers,
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
      print({ map, services })

      // Force map resize on container resize:
      const observer = new ResizeObserver(() => map.updateSize())
      observer.observe(ref.current)

      measure({ services, map })
    })()

    return () => map && map.dispose()
  }, [])

  return <div
    id='map'
    ref={ref}
    className='map'
    tabIndex='0'
  />
}
