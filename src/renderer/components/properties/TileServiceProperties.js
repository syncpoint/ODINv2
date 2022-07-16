/* eslint-disable react/prop-types */
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import { OSM } from 'ol/source'
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


/**
 *
 */
const fetchCapabilities = parser => async url => {
  //  Note: Currently this setting is required on BrowserWindow:
  //  {
  //    webPreferences: {
  //      webSecurity: false
  //    }
  //  }
  const response = await fetch(url)
  const text = await response.text()
  adapter(text)
  return parser.read(text)
}

const adapter = text => {
  let capabilities = WMSCapabilities.read(text)
  console.log('WMS', capabilities)
  capabilities = WMTSCapabilities.read(text)
  console.log('WMTS', capabilities)
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
      {props.title}
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

  const fitView = wgs84boundingBox => {
    if (wgs84boundingBox) {
      const southWest = fromLonLat(wgs84boundingBox.slice(0, 2))
      const northEast = fromLonLat(wgs84boundingBox.slice(2, 4))
      const extent = boundingExtent([southWest, northEast])
      map.getView().fit(extent)
    }
  }


  const setSource = (capabilities, id) => {
    const layer = capabilities.Contents.Layer.find(layer => layer.Identifier === id)
    fitView(layer.WGS84BoundingBox)

    const options = optionsFromCapabilities(capabilities, { layer: id })
    const layers = map.getAllLayers()
    layers[0].setSource(new WMTS(options))

  }

  const resetSource = () => {
    const layers = map.getAllLayers()
    layers[0].setSource(source)
  }

  emitter.on('set-source', ({ capabilities, id }) => setSource(capabilities, id))
  emitter.on('reset-source', () => resetSource())
}


/**
 * Derive list model from capabilities.
 */
const entriesFromCapabilities = capabilities => {
  const layers = capabilities?.Contents?.Layer
  return (layers || []).map(layer => ({
    id: layer.Identifier,
    title: layer.Title,
    abstract: layer.Abstract
  }))
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


  // Update selected layers and checked/selected state of list entries.
  //
  React.useEffect(() => {
    (async () => {
      const selectedLayers = await store.keys(`tile-layer:${key.split(':')[1]}`)
      const entries = entriesFromCapabilities(tileService.capabilities).reduce((acc, entry) => {
        const layerId = `tile-layer:${key.split(':')[1]}/${entry.id}`
        const checked = selectedLayers.includes(layerId)
        acc.push({ ...entry, checked })
        return acc
      }, [])

      dispatch({ type: 'entries', entries })
      setUrl(tileService.url)
      emitter.emit('reset-source')
    })()
  }, [store, emitter, key, tileService, dispatch])

  // TODO: prevent default for ArrowUp/-Down keys in list


  // Update selected/focused entry in list model.
  //
  const handleEntryClick = id => {
    emitter.emit('set-source', { capabilities: tileService.capabilities, id })
    dispatch({ type: 'select', id })
  }

  const handleUrlChange = ({ target }) => setUrl(target.value)


  // Load capabilities and update tile service and list model.
  //
  const handleUrlBlur = async () => {

    // Remove corresponding layers from selected layers.
    //
    await store.delete(`tile-layer:${key.split(':')[1]}`)

    // Fetch capabilities and update tile service and list model.
    const capabilities = await fetchCapabilities(new WMTSCapabilities())(url)
    const entries = entriesFromCapabilities(capabilities)

    const newValue = { ...tileService, url }
    if (capabilities) newValue.capabilities = capabilities
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


  return (
    <>
      <ColSpan2>
        <TextField label='URL' value={url} onChange={handleUrlChange} onBlur={handleUrlBlur}/>
      </ColSpan2>
      <Name {...props}/>
      <ServiceAbstract capabilities={tileService.capabilities}/>
      <ColSpan2>
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
      <ColSpan2>
        <div className='map-preview' id='map-preview'></div>
      </ColSpan2>
    </>
  )
}

export default TileServiceProperties
