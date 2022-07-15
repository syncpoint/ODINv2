/* eslint-disable react/prop-types */
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
/* import WMSCapabilities from 'ol/format/WMSCapabilities' */
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import { OSM } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'
import { defaults as defaultInteractions } from 'ol/interaction'
import Map from 'ol/Map'
import View from 'ol/View'
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
  return parser.read(text)
}


/**
 *
 */
const ServiceAbstract = props => {
  const { capabilities } = props
  const abstract = capabilities?.ServiceIdentification?.Abstract
  if (!abstract) return null

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

  emitter.on('layer', ({ capabilities, id: layer }) => {
    const options = optionsFromCapabilities(capabilities, { layer })
    const layers = map.getAllLayers()
    layers[0].setSource(new WMTS(options))
  })
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

  // TODO: write selected layers to store instead preferences store.
  /*
    const prefix = (([scope, id]) => `${scope}+layer:${id}`)(key.split(':')) // TODO: ids module
    tile-service:{UUID}
    tile-service+layer:{UUID}/{IDENTIFIER} [WMS, WMTS]
    tile-service+layer:{UUID} [XYZ]
    tile-service+z-index:({UUID}/{IDENTIFIER} | {UUID}) number
  */

  const { sessionStore, preferencesStore, store } = useServices()
  const [list, dispatch] = useList({ multiselect: false })
  const [emitter] = React.useState(new EventEmitter())
  const [url, setUrl] = React.useState(tileService.url)


  // Update selected layers and checked/selected state of list entries.
  //
  React.useEffect(() => {
    (async () => {
      const selectedLayers = await preferencesStore.getTileLayers()

      const entries = entriesFromCapabilities(tileService.capabilities).reduce((acc, entry) => {
        const layerId = `${key}/${entry.id}`
        const checked = selectedLayers.findIndex(layer => layer.id === layerId) !== -1
        acc.push({ ...entry, checked })
        return acc
      }, [])

      dispatch({ type: 'entries', entries })
      setUrl(tileService.url)

      // TODO: reset preview

    })()
  }, [preferencesStore, key, tileService, dispatch])

  // TODO: prevent default for ArrowUp/-Down keys in list


  // Update selected/focused entry in list model.
  //
  const handleEntryClick = id => {
    // TODO: respect layer bounding box if available
    emitter.emit('layer', { capabilities: tileService.capabilities, id })
    dispatch({ type: 'select', id })
  }

  const handleUrlChange = ({ target }) => setUrl(target.value)


  // Load capabilities and update tile service and list model.
  //
  const handleUrlBlur = async () => {

    // Remove corresponding layers from selected layers.
    //
    const selectedLayers = await preferencesStore.getTileLayers()
    const selected = selectedLayers.filter(layer => layer.id.startsWith(url))
    await preferencesStore.putTileLayers(selected)


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

    // Update tile layers selection in preferences store.
    //
    const selectedLayers = await preferencesStore.getTileLayers()
    const layerId = `${key}/${id}`
    const index = selectedLayers.findIndex(layer => layer.id === layerId)

    const selected = index === -1
      ? [...selectedLayers, { id: layerId }]
      : selectedLayers.filter(layer => layer.id !== layerId)

    await preferencesStore.putTileLayers(selected)

    // Update list model.
    //
    const entries = list.entries.reduce((acc, entry) => {
      const layerId = `${key}/${entry.id}`
      const checked = selected.findIndex(layer => layer.id === layerId) !== -1
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
