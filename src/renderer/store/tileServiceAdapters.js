import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
import TileJSON from 'ol/source/TileJSON'
import { OSM, XYZ } from 'ol/source'

/**
 *
 */
const wmtsAdapter = caps => {
  const layers = caps?.Contents?.Layer || []
  const findLayer = layerId => layers.find(layer => layer.Identifier === layerId)

  return {
    type: 'WMTS',
    capabilities: caps,
    title: caps?.ServiceIdentification?.Title,
    abstract: caps?.ServiceIdentification?.Abstract,
    layers: () => layers.map(layer => ({
      id: layer.Identifier,
      title: layer.Title,
      abstract: layer.Abstract
    })),
    layerName: layerId => findLayer(layerId)?.Title,
    boundingBox: layerId => findLayer(layerId)?.WGS84BoundingBox,
    source: layerId => {
      if (!layerId) return null

      const options = optionsFromCapabilities(caps, { layer: layerId })
      return options && new WMTS(options)
    }
  }
}


/**
 *
 */
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

  const findLayer = layerId => layers.find(layer => layer.Name === layerId)

  return {
    type: 'WMS',
    capabilities: caps,
    title: caps?.Service?.Title,
    abstract: caps?.Service?.Abstract,
    layers: () => layers.map(layer => ({
      id: layer.Name,
      title: layer.Title,
      abstract: layer.Abstract
    })),
    boundingBox: layerId => {
      if (version !== '1.3.0') return /* guess work */
      const layer = findLayer(layerId)
      return layer?.EX_GeographicBoundingBox
    },
    layerName: layerId => findLayer(layerId)?.Title,
    source: layerId => {
      if (!layerId) return null

      const params = { LAYERS: layerId, TILED: true }
      const crossOrigin = 'anonymous'
      const options = { url, params, crossOrigin }
      return new TileWMS(options)
    }
  }
}


/**
 *
 */
const xyzAdapter = caps => {
  return {
    type: 'XYZ',
    capabilities: caps,
    abstract: null,
    layers: () => [],
    boundingBox: () => null,
    layerName: () => null,
    source: () => new XYZ({
      url: caps.url,
      maxZoom: caps.maxZoom,
      crossOrigin: 'anonymous',
      interpolate: caps.contentType !== 'terrain/mapbox-rgb'
    })
  }
}


/**
 *
 */
const osmAdapter = () => ({
  type: 'OSM',
  capabilities: {},
  abstract: null,
  layers: () => [],
  boundingBox: () => null,
  layerName: () => null,
  source: () => new OSM()
})


/**
 * Adapter for TileJSON discovery endpoints that return an array of available tilesets.
 * Each service object should have at least `name` and `url` properties.
 * Works like WMS/WMTS - select tilesets to add them to the background maps.
 * The TileJSON source automatically respects minzoom/maxzoom from the TileJSON document.
 */
const tileJSONDiscoveryAdapter = caps => {
  const findService = id => caps.services.find(s => s.name === id)

  return {
    type: 'TileJSONDiscovery',
    capabilities: caps,
    title: 'TileJSON Server',
    abstract: null,
    layers: () => caps.services.map(s => ({
      id: s.name,
      title: s.name,
      abstract: s.description || ''
    })),
    boundingBox: id => findService(id)?.bounds,
    layerName: id => findService(id)?.name || id,
    source: id => {
      if (!id) return null
      const service = findService(id)
      if (!service?.url) return null
      // Resolve service URL against base URL (handles both relative and absolute URLs)
      const tileJSONUrl = new URL(service.url, caps.url).href
      return new TileJSON({ url: tileJSONUrl, crossOrigin: 'anonymous' })
    }
  }
}


/**
 * Adapter for individual TileJSON tileset.
 * The TileJSON source automatically respects minzoom/maxzoom from the TileJSON document.
 */
const tileJSONAdapter = caps => ({
  type: 'TileJSON',
  capabilities: caps,
  title: caps.tileJSON?.name,
  abstract: caps.tileJSON?.description || null,
  layers: () => [],
  boundingBox: () => caps.tileJSON?.bounds,
  layerName: () => caps.tileJSON?.name,
  source: () => new TileJSON({ url: caps.url, crossOrigin: 'anonymous' })
})


/**
 *
 */
export const adapters = {
  WMTS: wmtsAdapter,
  WMS: wmsAdapter,
  XYZ: xyzAdapter,
  OSM: osmAdapter,
  TileJSONDiscovery: tileJSONDiscoveryAdapter,
  TileJSON: tileJSONAdapter
}


export const adapter = text => {
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
