/* eslint-disable react/prop-types */
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
import { OSM, XYZ } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'
import { defaults as defaultInteractions } from 'ol/interaction'
import Map from 'ol/Map'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { boundingExtent } from 'ol/extent'
import React from 'react'
import ColSpan2 from './ColSpan2'
import TextField from './TextField'
import Name from './Name'
import './TileServiceProperties.css'
import { useList, useServices } from '../hooks'
import EventEmitter from '../../../shared/emitter'


const wmtsAdapter = caps => {
  const layers = caps?.Contents?.Layer || []

  return {
    type: 'WMTS',
    capabilities: caps,
    abstract: caps?.ServiceIdentification?.Abstract,
    layers: () => layers.map(layer => ({
      id: layer.Identifier,
      title: layer.Title,
      abstract: layer.Abstract
    })),
    boundingBox: layerId => {
      const layer = layers.find(layer => layer.Identifier === layerId)
      return layer && layer.WGS84BoundingBox
    },
    source: layerId => {
      const options = optionsFromCapabilities(caps, { layer: layerId })
      return new WMTS(options)
    }
  }
}

const wmsAdapter = caps => {
  const version = caps?.version
  const url = caps?.Capability?.Request?.GetMap?.DCPType[0]?.HTTP?.Get?.OnlineResource

  // Layer names are not always unique.
  // We take this first layer and discard duplicates.
  const seen = []
  const layers = (caps?.Capability?.Layer?.Layer || []).reduce((acc, layer) => {
    if (seen.includes(layer.Name)) return acc
    seen.push(layer.Name)
    acc.push(layer)
    return acc
  }, [])

  return {
    type: 'WMS',
    capabilities: caps,
    abstract: caps?.Service?.Abstract,
    layers: () => layers.map(layer => ({
      id: layer.Name,
      title: layer.Title,
      abstract: layer.Abstract
    })),
    boundingBox: layerId => {
      if (version !== '1.3.0') return /* guess work */
      const layer = layers.find(layer => layer.Name === layerId)
      return layer?.EX_GeographicBoundingBox
    },
    source: layerId => {
      const options = {
        url,
        params: { LAYERS: layerId, TILED: true },
        crossOrigin: 'anonymous'
      }

      return new TileWMS(options)
    }
  }
}

const xyzAdapter = caps => ({
  type: 'XYZ',
  capabilities: caps,
  abstract: null,
  layers: () => [],
  boundingBox: () => null,
  source: () => new XYZ({ url: caps.url })
})

const osmAdapter = () => ({
  type: 'OSM',
  capabilities: {},
  abstract: null,
  layers: () => [],
  boundingBox: () => null,
  source: () => new OSM()
})

const adapters = {
  WMTS: wmtsAdapter,
  WMS: wmsAdapter,
  XYZ: xyzAdapter,
  OSM: osmAdapter
}


const adapter = text => {
  {
    const caps = (new WMSCapabilities()).read(text)
    if (caps && caps.Service && caps.Capability) {
      return wmsAdapter(caps)
    }
  }

  {
    const caps = (new WMTSCapabilities()).read(text)
    if (caps && caps.ServiceIdentification && caps.Contents) {
      return wmtsAdapter(caps)
    }
  }
}


/**
 *
 */
const fetchCapabilities = async url => {
  //  Note: Currently this setting is required on BrowserWindow:
  //  {webPreferences: {webSecurity: false}}

  try {
    const response = await fetch(url)
    const text = await response.text()
    return adapter(text)
  } catch (err) {
    return adapters.XYZ({ url })
  }
}


/**
 *
 */
const ServiceAbstract = props => {
  const { capabilities } = props
  const abstract = capabilities?.ServiceIdentification?.Abstract
  if (!abstract) return null
  if (abstract.length < 8) return null

  return (
    <ColSpan2>
      <div className='service-abstract'>{abstract}</div>
    </ColSpan2>
  )
}


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
        checked={props.checked || false}
        onChange={() => props.onChange(props.id)}
      />
      <span className='layer-list__title'>{props.title}</span>
    </div>
  )
}


/**
 *
 */
const map = (emitter, viewport) => {
  const target = document.getElementById('map-preview')
  const source = new OSM()
  const tileLayer = new TileLayer({ source })
  const view = new View({ ...viewport })

  const map = new Map({
    target,
    interactions: defaultInteractions(),
    controls: [],
    layers: [tileLayer],
    view
  })

  const fitView = boundingBox => {
    if (boundingBox) {
      const southWest = fromLonLat(boundingBox.slice(0, 2))
      const northEast = fromLonLat(boundingBox.slice(2, 4))
      const extent = boundingExtent([southWest, northEast])
      map.getView().fit(extent)
    }
  }


  const setSource = (adapter, id = null) => {
    fitView(adapter.boundingBox(id))
    const layers = map.getAllLayers()
    layers[0].setSource(adapter.source(id))
  }

  const resetSource = () => {
    const layers = map.getAllLayers()
    layers[0].setSource(source)
  }

  emitter.on('set-source', ({ adapter, id }) => setSource(adapter, id))
  emitter.on('reset-source', () => resetSource())
}


/**
 *
 */
const TileServiceProperties = props => {
  const [key, tileService] = (Object.entries(props.features))[0]
  const { sessionStore, store } = useServices()
  const [list, dispatch] = useList({ multiselect: false })
  const [emitter] = React.useState(new EventEmitter())
  const [url, setUrl] = React.useState(tileService.url)
  const [urlDirty, setUrlDirty] = React.useState(false)


  // Update selected layers and checked/selected state of list entries.
  //
  React.useEffect(() => {
    (async () => {
      const selectedLayers = await store.keys(`tile-layer:${key.split(':')[1]}`)
      const adapter = adapters[tileService.type](tileService.capabilities)
      const entries = adapter.layers().reduce((acc, entry) => {
        const layerId = `tile-layer:${key.split(':')[1]}/${entry.id}`
        const checked = selectedLayers.includes(layerId)
        acc.push({ ...entry, checked })
        return acc
      }, [])

      dispatch({ type: 'entries', entries })
      setUrl(tileService.url)

      if (['XYZ', 'OSM'].includes(tileService.type)) emitter.emit('set-source', { adapter })
      else emitter.emit('reset-source')
    })()
  }, [store, emitter, key, tileService, dispatch])

  // TODO: prevent default for ArrowUp/-Down keys in list


  // Update selected/focused entry in list model.
  //
  const handleEntryClick = id => {
    const adapter = adapters[tileService.type](tileService.capabilities)
    emitter.emit('set-source', { adapter, id })
    dispatch({ type: 'select', id })
  }

  const handleUrlChange = ({ target }) => {
    if (url === target.value) return
    setUrl(target.value)
    setUrlDirty(true)
  }


  // Load capabilities and update tile service and list model.
  //
  const handleUrlBlur = async () => {
    if (!urlDirty) return
    setUrlDirty(false)

    // Remove corresponding layers from selected layers.
    //
    await store.delete(`tile-layer:${key.split(':')[1]}`)

    // Fetch capabilities and update tile service and list model.
    const adapter = await fetchCapabilities(url)
    const entries = adapter.layers()

    const newValue = { ...tileService, type: adapter.type, url }
    if (adapter.capabilities) newValue.capabilities = adapter.capabilities
    await store.update([key], [newValue], [tileService])

    setUrl(url)
    dispatch({ type: 'entries', entries })
  }


  // Toggle entry checked state and update list model
  // including selection.
  //
  const handleEntryChange = async id => {

    // Update tile layers selection.
    //
    const layerId = `tile-layer:${key.split(':')[1]}/${id}`
    const selectedLayers = await store.keys(`tile-layer:${key.split(':')[1]}`)

    if (selectedLayers.includes(layerId)) await store.delete(layerId)
    else await store.insert([[layerId, {}]])

    const selected = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId]

    const entries = list.entries.reduce((acc, entry) => {
      const layerId = `tile-layer:${key.split(':')[1]}/${entry.id}`
      const checked = selected.includes(layerId)
      acc.push({ ...entry, checked })
      return acc
    }, [])

    dispatch({ type: 'entries', entries })
    dispatch({ type: 'select', id })
  }


  // Create map preview with current viewport.
  //
  React.useEffect(() => {
    sessionStore.getViewport().then(viewport => map(emitter, viewport))
  }, [sessionStore, emitter])

  const layerList = list.entries.length === 0
    ? null
    : <ColSpan2>
        <div className='layer-list'>
        {
          list.entries.map((layer, index) => (
            <LayerEntry
              key={layer.id}
              selected={index === list.focusIndex}
              checked={layer.checked}
              onClick={handleEntryClick}
              onChange={handleEntryChange}
              { ...layer }
            />
          ))
        }
        </div>
      </ColSpan2>


  return (
    <>
      <Name {...props}/>
      <ColSpan2>
        <TextField label='URL' value={url} onChange={handleUrlChange} onBlur={handleUrlBlur}/>
      </ColSpan2>
      <ServiceAbstract capabilities={tileService.capabilities}/>
      { layerList }
      <ColSpan2>
        <div className='map-preview' id='map-preview'></div>
      </ColSpan2>
    </>
  )
}

export default TileServiceProperties
