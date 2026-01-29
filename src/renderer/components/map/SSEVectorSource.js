// SSEVectorSource.js
import VectorSource from 'ol/source/Vector'
import { reproject } from 'reproject'
import { readFeature } from '../../model/sources/featureSource'
import { format } from '../../ol/format'
import { defaultStyle } from '../../store/schema/default-style'
import * as ID from '../../ids'

class SSEVectorSource extends VectorSource {
  constructor (options = {}) {
    const state = {}

    const params = {
      features: [],
      useSpatialIndex: false,
      strategy: function (extent, resolution) {
        if (state.resolution !== resolution) {
          state.resolution = resolution
          this.getFeatures().map(feature => feature.$.centerResolution(resolution))
        }
        return [extent]
      }
    }


    super({ ...options, ...params })

    // SSE Konfiguration
    this.sseUrl = options.sseUrl
    this.updateInterval = options.updateInterval || 100 // ms
    this.dataProjection = options.dataProjection || 'EPSG:4326'
    this.featureProjection = options.featureProjection || 'EPSG:3857'
    this.eventType = options.eventType || 'message'
    this.useFeatureIds = options.useFeatureIds !== false // Default: true
    this.idPrefix = options.idPrefix || 'feature:'

    this.featureReader = readFeature({
      styles: {
        [ID.defaultStyleId]: defaultStyle
      }
    })

    // Rate-Limiter State
    this.pendingData = null
    this.lastUpdate = 0
    this.timerId = null


    // Statistics
    this.stats = {
      messagesReceived: 0,
      mapUpdates: 0,
      lastUpdateTime: null,
      connectionTime: null
    }

    // SSE Connection
    this.eventSource = null

    // Callbacks
    this.onConnectionOpen = options.onConnectionOpen || null
    this.onConnectionError = options.onConnectionError || null
    this.onMessage = options.onMessage || null

    // Auto-connect wenn URL vorhanden
    if (this.sseUrl) {
      this.connect()
    }
  }

  connect () {
    if (this.eventSource) {
      this.disconnect()
    }

    this.eventSource = new EventSource(this.sseUrl)

    this.eventSource.addEventListener('open', () => {
      this.stats.connectionTime = new Date()
      if (this.onConnectionOpen) {
        this.onConnectionOpen()
      }
      this.dispatchEvent({
        type: 'sse-connected',
        source: this
      })
    })

    this.eventSource.addEventListener(this.eventType, (event) => {
      this.stats.messagesReceived++

      try {
        const data = JSON.parse(event.data)
        if (data.id) {
          data.id = `${this.idPrefix}${data.id}`
        }
        if (this.onMessage) {
          this.onMessage(data)
        }

        this.scheduleUpdate(data)
      } catch (error) {
        console.error('SSE message parsing error:', error)
        this.dispatchEvent({
          type: 'sse-error',
          error,
          source: this
        })
      }
    })

    this.eventSource.addEventListener('error', (error) => {
      if (this.onConnectionError) {
        this.onConnectionError(error)
      }
      this.dispatchEvent({
        type: 'sse-error',
        error,
        source: this
      })
    })
  }

  disconnect () {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }

    this.dispatchEvent({
      type: 'sse-disconnected',
      source: this
    })
  }

  scheduleUpdate (data) {
    this.pendingData = data

    const now = Date.now()
    const timeSinceLastUpdate = now - this.lastUpdate

    if (timeSinceLastUpdate >= this.updateInterval) {
      this.flushUpdate()
    } else if (!this.timerId) {
      this.timerId = setTimeout(() => {
        this.flushUpdate()
      }, this.updateInterval - timeSinceLastUpdate)
    }
  }

  flushUpdate () {
    if (!this.pendingData) {
      return
    }

    try {
      let features = []
      if (this.pendingData.type === 'FeatureCollection') {
        features = [...this.pendingData.features]
      } else if (this.pendingData.type === 'Feature') {
        features.push(this.pendingData)
      } else {
        console.warn('Unknown feature type ' + this.pendingData.type)
      }

      if (this.useFeatureIds) {
        this.updateFeaturesById(features)
      } else {
        this.replaceAllFeatures(features)
      }

      this.stats.mapUpdates++
      this.stats.lastUpdateTime = new Date()

      this.dispatchEvent({
        type: 'sse-features-updated',
        features,
        source: this
      })

    } catch (error) {
      console.error('Feature update error:', error)
      this.dispatchEvent({
        type: 'sse-update-error',
        error,
        source: this
      })
    }

    this.pendingData = null
    this.lastUpdate = Date.now()

    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  // Reproject GeoJSON geometry from dataProjection to featureProjection
  reprojectGeometry (geometry) {
    if (this.dataProjection === this.featureProjection) {
      return geometry
    }
    return reproject(geometry, this.dataProjection, this.featureProjection)
  }

  // Replace all features (for sources without IDs)
  replaceAllFeatures (features) {
    this.clear()
    const olFeatures = features.map(feature => {
      const reprojectedFeature = {
        ...feature,
        geometry: this.reprojectGeometry(feature.geometry)
      }
      return this.featureReader(reprojectedFeature)
    })
    this.addFeatures(olFeatures)
  }

  // features Array[GeoJSON]
  updateFeaturesById (features) {
    features.forEach(feature => {
      const featureId = feature.id
      if (!featureId) {
        console.warn('feature has no id')
        return
      }

      // Reproject the geometry before processing
      const reprojectedFeature = {
        ...feature,
        geometry: this.reprojectGeometry(feature.geometry)
      }

      const existingFeature = this.getFeatureById(featureId)
      if (existingFeature) {
        existingFeature.setProperties(reprojectedFeature.properties)
        const geometry = format.readGeometry(reprojectedFeature.geometry)
        existingFeature.setGeometry(geometry)
      } else {
        const olFeature = this.featureReader(reprojectedFeature)
        this.addFeature(olFeature)
      }
    })
  }

  setUpdateInterval (interval) {
    this.updateInterval = interval
  }

  getStats () {
    return {
      ...this.stats,
      isConnected: this.isConnected(),
      featureCount: this.getFeatures().length,
      cachedFeatureIds: this.featureCache.size
    }
  }

  isConnected () {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN
  }

  clearFeatureCache () {
    this.featureCache.clear()
  }

  dispose () {
    this.disconnect()
    this.clearFeatureCache()
    super.dispose()
  }
}

export default SSEVectorSource
