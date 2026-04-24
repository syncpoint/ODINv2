import Collection from 'ol/Collection'
import LayerGroup from 'ol/layer/Group'
import HeatmapLayer from 'ol/layer/Heatmap'
import VectorLayer from 'ol/layer/Vector'
import * as ID from '../ids'
import SSEVectorSource from '../components/map/SSEVectorSource'

/**
 * Bridge between persisted SSE services and OpenLayers layers.
 * Manages SSE connections and layer lifecycle.
 */
export default function SSELayerStore (store) {
  this.store = store
  this.layers = new Map() // key -> { layer, source }
  this.layerCollection = null
  this.layerGroup = null
}

/**
 * Register batch listeners for SSE service changes.
 */
SSELayerStore.prototype.bootstrap = async function () {
  this.store.on('batch', ({ operations }) => {
    const sseOperations = operations.filter(({ key }) => ID.isSSEServiceId(key))
    if (sseOperations.length > 0) {
      this.updateServices(sseOperations)
    }
  })
}

/**
 * Create LayerGroup with layers for enabled services.
 */
SSELayerStore.prototype.sseLayers = async function () {
  const services = await this.store.tuples(ID.SSE_SERVICE_SCOPE)

  for (const [key, service] of services) {
    if (service.enabled) {
      this.createLayer(key, service)
    }
  }

  const heatmapLayers = []
  const vectorLayers = []
  for (const { layer } of this.layers.values()) {
    if (layer instanceof HeatmapLayer) {
      heatmapLayers.push(layer)
    } else {
      vectorLayers.push(layer)
    }
  }

  this.layerCollection = new Collection([...heatmapLayers, ...vectorLayers])
  this.layerGroup = new LayerGroup({ layers: this.layerCollection })
  return [this.layerGroup]
}

/**
 * Create a VectorLayer or HeatmapLayer with SSEVectorSource for a service.
 */
SSELayerStore.prototype.createLayer = function (key, service) {
  if (this.layers.has(key)) {
    return this.layers.get(key)
  }

  const renderMode = service.renderMode || 'vector'

  const source = new SSEVectorSource({
    sseUrl: service.url,
    eventType: service.eventType || 'message',
    dataProjection: service.dataProjection || 'EPSG:4326',
    updateInterval: service.updateInterval || 100,
    idPrefix: service.featureIdPrefix || 'feature:',
    useFeatureIds: service.useFeatureIds !== false,
    renderMode,
    heatmapInterval: service.heatmapInterval ?? 1000,
    maxHeatmapFeatures: service.maxHeatmapFeatures ?? 50000
  })

  let layer
  if (renderMode === 'heatmap') {
    layer = new HeatmapLayer({
      source,
      id: key,
      blur: service.heatmapBlur ?? 15,
      radius: service.heatmapRadius ?? 20,
      opacity: service.heatmapOpacity ?? 0.75,
      weight: feature => feature.get('weight') ?? 0.5
    })
  } else {
    layer = new VectorLayer({
      source,
      id: key,
      opacity: service.vectorOpacity ?? 1
    })
  }

  this.layers.set(key, { layer, source })

  if (service.enabled && service.url) {
    source.connect()
  }

  return { layer, source }
}

/**
 * Handle add/update/delete operations for SSE services.
 */
SSELayerStore.prototype.updateServices = function (operations) {
  for (const { type, key, value } of operations) {
    if (type === 'del') {
      this.removeLayer(key)
    } else if (type === 'put') {
      this.updateOrCreateService(key, value)
    }
  }
}

/**
 * Update an existing service or create a new one.
 */
SSELayerStore.prototype.updateOrCreateService = function (key, service) {
  const existing = this.layers.get(key)

  if (existing) {
    const { source, layer } = existing

    // Render mode change requires full layer recreate
    const renderMode = service.renderMode || 'vector'
    if (source.renderMode !== renderMode) {
      this.removeLayer(key)
      if (service.enabled) {
        const { layer: newLayer } = this.createLayer(key, service)
        this.insertLayerOrdered(newLayer)
      }
      return
    }

    // Dynamically update layer properties based on mode
    if (renderMode === 'heatmap' && layer instanceof HeatmapLayer) {
      layer.setBlur(service.heatmapBlur ?? 15)
      layer.setRadius(service.heatmapRadius ?? 20)
      layer.setOpacity(service.heatmapOpacity ?? 0.75)
      source.heatmapInterval = service.heatmapInterval ?? 1000
      source.maxHeatmapFeatures = service.maxHeatmapFeatures ?? 50000
    } else {
      layer.setOpacity(service.vectorOpacity ?? 1)
    }

    // Check if we need to reconnect due to config changes
    const configChanged = source.sseUrl !== service.url ||
                          source.eventType !== (service.eventType || 'message') ||
                          source.dataProjection !== (service.dataProjection || 'EPSG:4326') ||
                          source.useFeatureIds !== (service.useFeatureIds !== false)

    if (configChanged) {
      // Disconnect and reconfigure
      source.disconnect()
      source.sseUrl = service.url
      source.eventType = service.eventType || 'message'
      source.dataProjection = service.dataProjection || 'EPSG:4326'
      source.updateInterval = service.updateInterval || 100
      source.useFeatureIds = service.useFeatureIds !== false
    }

    // Update interval can be changed without reconnect
    source.setUpdateInterval(service.updateInterval || 100)

    // Handle enabled state change
    if (service.enabled && service.url && !source.isConnected()) {
      source.connect()
    } else if (!service.enabled) {
      source.disconnect()
      source.clear()
    }
  } else if (service.enabled) {
    // Create new layer for enabled service
    const { layer } = this.createLayer(key, service)
    this.insertLayerOrdered(layer)
  }
}

/**
 * Insert a layer at the correct position: heatmap layers before all vector layers.
 */
SSELayerStore.prototype.insertLayerOrdered = function (layer) {
  if (!this.layerCollection) return
  if (layer instanceof HeatmapLayer) {
    const index = this.layerCollection.getArray().findIndex(l => !(l instanceof HeatmapLayer))
    if (index === -1) {
      this.layerCollection.push(layer)
    } else {
      this.layerCollection.insertAt(index, layer)
    }
  } else {
    this.layerCollection.push(layer)
  }
}

/**
 * Remove a layer and disconnect its source.
 */
SSELayerStore.prototype.removeLayer = function (key) {
  const existing = this.layers.get(key)
  if (!existing) return

  const { layer, source } = existing
  source.disconnect()
  source.clear()

  if (this.layerCollection) {
    this.layerCollection.remove(layer)
  }

  this.layers.delete(key)
}

/**
 * Toggle enabled state for a service.
 */
SSELayerStore.prototype.toggleEnabled = async function (key) {
  const [service] = await this.store.values(key)
  if (!service) return

  const enabled = !service.enabled
  const value = { ...service, enabled }
  this.store.update([key], [value], [service])
}

/**
 * Get connection status and stats for a service.
 */
SSELayerStore.prototype.getServiceStats = function (key) {
  const existing = this.layers.get(key)
  if (!existing) {
    return { isConnected: false, featureCount: 0 }
  }

  const { source } = existing
  return {
    isConnected: source.isConnected(),
    messagesReceived: source.stats.messagesReceived,
    mapUpdates: source.stats.mapUpdates,
    lastUpdateTime: source.stats.lastUpdateTime,
    connectionTime: source.stats.connectionTime,
    featureCount: source.getFeatures().length
  }
}
