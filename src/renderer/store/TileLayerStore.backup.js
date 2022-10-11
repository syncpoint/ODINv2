import * as R from 'ramda'
import { Tile as TileLayer } from 'ol/layer'
import Collection from 'ol/Collection'
import LayerGroup from 'ol/layer/Group'
import * as ID from '../ids'
import * as TileService from './tileServiceAdapters'

/**
 *
 */
const fetchCapabilities = async service => {
  if (!service || !service.url || service.url.length === 0) return TileService.adapters.OSM()

  try {
    const response = await fetch(service.url)
    if ([400, 404, 500].includes(response.status)) {
      throw new Error(response.statusText)
    }
    const text = await response.text()
    return TileService.adapter(text)
  } catch (err) {
    return TileService.adapters.XYZ({
      url: service.url,
      maxZoom: service.capabilities?.maxZoom || 24
    })
  }
}

const defaultService = { name: 'OSM', type: 'OSM', url: '' }

const osmLayer = {
  id: ID.defaultTileLayerId,
  name: 'OSM',
  opacity: 1.0,
  visible: true
}

const defaultPreset = [osmLayer]

/**
 * Store frontend. Encapsulate rather complex tile layer and
 * configuration persistence.
 */
export default function TileLayerStore (store) {
  this.store = store
  this.ready = false

  store.on('batch', ({ operations }) => {

    // No need to shoot ourselves in the foot (during initialization):
    // Creating default service and preset would trigger updates
    // of incomplete state.
    //
    if (!this.ready) return

    const updatePreset = operations.some(({ key }) => ID.isTileServiceId(key))
    if (updatePreset) this.updatePreset()

    const presets = operations.filter(({ type, key }) => type === 'put' && ID.isTilePresetId(key))
    if (presets.length === 1) this.updateLayers(presets[0].value)
  })
}

TileLayerStore.tileLayer = function (services) {
  return ({ id, opacity, visible }, index) => {
    const { type, capabilities } = services[ID.tileServiceId(id)]
    const adapter = TileService.adapters[type](capabilities)
    const source = adapter.source(ID.containedId(id))
    return new TileLayer({ source, id, opacity, visible, zIndex: 0 - index })
  }
}

/**
 *
 */
TileLayerStore.prototype.tileLayers = async function () {
  const preset = await this.preset()
  const services = Object.fromEntries(await this.store.tuples('tile-service:'))
  const layers = preset.map(TileLayerStore.tileLayer(services))

  // Lazy init group for tile layers.
  this.layerCollection = new Collection(layers)
  this.layerGroup = new LayerGroup({ layers: this.layerCollection })
  return [this.layerGroup]
}


/**
 *
 */
TileLayerStore.prototype.updateService = async function (key, service) {

  const capabilities = async acc => {
    const service = await acc

    // Nothing to fetch: Keep name, default to OSM.
    if (!service.url) return { type: 'OSM', name: service.name || '', url: '' }

    const { type, title, capabilities } = await fetchCapabilities(service)
    const name = service.name || title
    return { ...service, type, name, capabilities }
  }

  const newValue = await capabilities(service)
  this.store.update([key], [newValue], [service])
}


/**
 *
 */
TileLayerStore.prototype.serviceLayers = async function (key) {
  const [service] = await this.store.values(key)
  if (!service) return []

  const comapreTitles = (a, b) => a.title.localeCompare(b.title)
  const { type, capabilities, active = [] } = service
  const adapter = TileService.adapters[type](capabilities)
  return adapter.layers().sort(comapreTitles).map(layer => ({
    ...layer,
    active: active.includes(layer.id)
  }))
}


/**
 *
 */
TileLayerStore.prototype.toggleActiveLayer = async function (key, id) {
  const [service] = await this.store.values(key)
  if (!service) return

  const activeLayers = service.active || []
  const active = activeLayers.includes(id)
    ? activeLayers.filter(x => x !== id)
    : [...activeLayers, id]

  const value = { ...service, active }
  this.store.update([key], [value], [service])
}


/**
 *
 */
TileLayerStore.prototype.preset = async function () {
  const [service] = await this.store.values(ID.defaultTileServiceId)
  if (!service) await this.store.update([ID.defaultTileServiceId], [defaultService])

  const createPreset = async () => {
    await this.store.update([ID.tilePresetId()], [defaultPreset])
    return defaultPreset
  }

  const values = await this.store.values(ID.tilePresetId())
  const preset = values.length
    ? values[0]
    : createPreset()

  // Switch to ready state on next tick.
  setTimeout(() => (this.ready = true))

  return preset
}


/**
 *
 */
TileLayerStore.prototype.updateOpacity = function (preset, id, opacity) {
  const [key, layers] = preset
  const index = layers.findIndex(entry => entry.id === id)
  const newValue = [...layers]
  newValue[index] = { ...layers[index], opacity }
  this.store.updateCollapsible([key], [newValue], [layers], '650f480a-6184-4e8a-aef8-2d6abc2c0171')
}


/**
 *
 */
TileLayerStore.prototype.toggleVisible = function (preset, id) {
  const [key, layers] = preset
  const index = layers.findIndex(entry => entry.id === id)
  const newValue = [...layers]
  newValue[index] = { ...layers[index], visible: !layers[index].visible }
  this.store.update([key], [newValue], [layers])
}


/**
 *
 */
TileLayerStore.prototype.updateOrder = function (preset, from, to) {
  const [key, layers] = preset
  const newValue = R.move(from, to, layers)
  this.store.update([key], [newValue], [layers])
  return newValue
}


/**
 *
 */
TileLayerStore.prototype.updatePreset = async function () {
  const [currentPreset] = await this.store.values(ID.tilePresetId())
  const currentLayers = currentPreset.map(({ id }) => id)
  const services = await this.store.tuples(ID.TILE_SERVICE_SCOPE)
  const findService = id => services.find(([key]) => key === id)
  const adapter = ([key, { type, capabilities }]) => [key, TileService.adapters[type](capabilities)]
  const adapters = Object.fromEntries(services.map(adapter))

  const activeLayerIds = services.flatMap(([key, service]) =>
    ['OSM', 'XYZ'].includes(service.type)
      ? ID.tileLayerId(key)
      : (service.active || []).map(id => ID.tileLayerId(key, id))
  )

  const removals = currentLayers.filter(x => !activeLayerIds.includes(x))

  const layerName = id => {
    const [key, service] = findService(ID.tileServiceId(id))
    return ['OSM', 'XYZ'].includes(service.type)
      ? service.name
      : adapters[key].layerName(ID.containedId(id))
  }

  const layer = id => ({ id, opacity: 1.0, visible: false })
  const additions = activeLayerIds.filter(x => !currentLayers.includes(x)).map(layer)

  // Propagate name changes from service to preset (only for OSM, XYZ.)
  //
  const propagateName = layer => ({ ...layer, name: layerName(layer.id) })
  const preset = (currentPreset.concat(additions))
    .filter(layer => !removals.includes(layer.id))
    .map(propagateName)

  this.store.update([ID.tilePresetId()], [preset])
}


/**
 *
 */
TileLayerStore.prototype.updateLayers = async function (preset) {
  const currentLayers = this.layerCollection.getArray()
  const findLayer = id => currentLayers.find(layer => layer.get('id') === id)
  const services = Object.fromEntries(await this.store.tuples('tile-service:'))

  const updateLayer = (layer, properties, index) => {
    layer.setOpacity(properties.opacity)
    layer.setVisible(properties.visible)
    layer.setZIndex(0 - index)
    return layer
  }

  const createLayer = TileLayerStore.tileLayer(services)

  const reducer = async (acc, properties, index) => {
    const layers = await acc
    const layer = findLayer(properties.id)
    if (layer) layers.push(updateLayer(layer, properties, index))
    else layers.push(createLayer(properties, index))
    return layers
  }

  // Prepare new layer collection to replace current.
  //
  const layers = await [...preset].reduce(reducer, new Collection())
  this.layerGroup.setLayers(layers)
}
