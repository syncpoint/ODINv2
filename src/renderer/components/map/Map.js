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
import mapEffect from './effect'
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
      const showing = await services.preferencesStore.getSymbolPropertiesShowing()
      symbolPropertiesShowing(showing)
    })()

    const handle = ({ value }) => symbolPropertiesShowing(value)
    services.preferencesStore.on(key, handle)

    return () => services.preferencesStore.off(key, handle)
  }, [services.preferencesStore, symbolPropertiesShowing])

  const effect = mapEffect({
    services,
    ref,
    symbolPropertiesShowing,
    ol,
    ScaleLine,
    Rotate,
    defaultInteractions,
    vectorSources,
    createMapView,
    createLayerStyles,
    createVectorLayers,
    createTileLayers,
    registerEventHandlers,
    registerGraticules,
    measure,
    print
  })

  React.useEffect(() => effect(), [])

  return <div
    id='map'
    ref={ref}
    className='map'
    tabIndex='0'
  />
}
