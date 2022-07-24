/* eslint-disable react/prop-types */
import { OSM } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'
import { defaults as defaultInteractions } from 'ol/interaction'
import Map from 'ol/Map'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { boundingExtent } from 'ol/extent'
import React from 'react'
import './TileServiceProperties.css'
import ColSpan2 from './ColSpan2'
import TextField from './TextField'
import FlexColumnGap from './FlexColumnGap'
import Name from './Name'
import { useList, useServices } from '../hooks'
import * as TileService from '../../store/tileServiceAdapters'


/**
 *
 */
const LayerEntry = props => {
  return (
    <div
      className='layer-list__entry'
      tabIndex='0'
      onClick={() => props.onClick(props.id)}
      aria-selected={props.selected}
    >
      <input
        className='layer-list_checkbox'
        type='checkbox'
        checked={props.active || false}
        onChange={() => props.onChange(props.id)}
      />
      <span className='layer-list__title'>{props.title}</span>
    </div>
  )
}


/**
 *
 */
const TileServiceProperties = props => {
  const { tileLayerStore, sessionStore } = useServices()
  const [key, service] = (Object.entries(props.features))[0]
  const [url, setUrl] = React.useState({ dirty: false, value: service.url || '' })
  const [list, dispatch] = useList({ multiselect: false })

  React.useEffect(() => {
    (async () => {
      const entries = await tileLayerStore.serviceLayers(key)
      dispatch({ type: 'entries', entries })
      setUrl({ dirty: false, value: service.url })
    })()
  }, [key, service, dispatch, tileLayerStore])

  React.useEffect(() => {
    const target = document.getElementById('map-preview')
    const { type, capabilities } = service
    const adapter = type && TileService.adapters[type](capabilities)
    const selected = list.selected.length === 1 ? list.selected[0] : null
    const source = (adapter && adapter.source(selected)) || new OSM()
    const tileLayer = new TileLayer({ source })
    const view = new View({}) // configured down below.

    const map = new Map({
      target,
      interactions: defaultInteractions(),
      controls: [],
      layers: [tileLayer],
      view
    })

    // Fit view after map is added to DOM (target pixel size).
    const boundingBox = adapter?.boundingBox(selected)
    if (boundingBox) {
      const southWest = fromLonLat(boundingBox.slice(0, 2))
      const northEast = fromLonLat(boundingBox.slice(2, 4))
      const extent = boundingExtent([southWest, northEast])
      view.fit(extent)
    } else {
      (async () => {
        const { center, resolution } = await sessionStore.getViewport()
        view.setCenter(center)
        view.setResolution(resolution)
      })()
    }

    // Setting null target should dispose map.
    return () => map.setTarget(null)
  }, [service, list.selected, sessionStore])

  // TODO: prevent default for ArrowUp/-Down keys in list

  const handleUrlChange = ({ target }) => {
    if (url.value === target.value) return
    setUrl({ dirty: true, value: target.value })
  }

  const handleUrlBlur = async () => {
    if (!url.dirty) return
    setUrl({ dirty: false, value: url.value })
    tileLayerStore.updateService(key, { ...service, url: url.value })
  }

  const handleEntryChange = async id => {
    console.log('handleEntryChange', key, id)
    tileLayerStore.toggleActiveLayer(key, id)
  }

  const handleEntryClick = id => {
    dispatch({ type: 'select', id })
  }

  const layerList = list.entries.length === 0
    ? null
    : <ColSpan2>
        <div className='layer-list'>
        {
          list.entries.map((layer, index) => (
            <LayerEntry
              key={layer.id}
              selected={index === list.focusIndex}
              active={layer.active}
              onClick={handleEntryClick}
              onChange={handleEntryChange}
              { ...layer }
            />
          ))
        }
        </div>
      </ColSpan2>

  // TODO: add layer filter field

  return (
    <FlexColumnGap>
      <Name {...props}/>
      <TextField label='URL' value={url.value} onChange={handleUrlChange} onBlur={handleUrlBlur}/>      { layerList }
      <div className='map-preview' id='map-preview'></div>
    </FlexColumnGap>
  )

}

export default TileServiceProperties
