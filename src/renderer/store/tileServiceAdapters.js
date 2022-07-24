import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
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
const xyzAdapter = caps => ({
  type: 'XYZ',
  capabilities: caps,
  abstract: null,
  layers: () => [],
  boundingBox: () => null,
  layerName: () => null,
  source: () => new XYZ({ url: caps.url })
})


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
 *
 */
export const adapters = {
  WMTS: wmtsAdapter,
  WMS: wmsAdapter,
  XYZ: xyzAdapter,
  OSM: osmAdapter
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
