// SSEVectorSource.js
import VectorSource from 'ol/source/Vector'
import { reproject } from 'reproject'
import { readFeature } from '../../model/sources/featureSource'
import { format } from '../../ol/format'
import { defaultStyle } from '../../store/schema/default-style'
import * as ID from '../../ids'

/**
 * @typedef {import('ol/Feature').default} Feature
 * @typedef {import('ol/geom/Geometry').default} Geometry
 */

/**
 * @typedef {Object} GeoJSONGeometry
 * @property {string} type - Geometry type (Point, LineString, Polygon, etc.)
 * @property {number[]|number[][]|number[][][]} coordinates - Coordinate array
 */

/**
 * @typedef {Object} GeoJSONFeature
 * @property {'Feature'} type - Must be 'Feature'
 * @property {string|number} [id] - Optional feature identifier
 * @property {GeoJSONGeometry} geometry - Feature geometry
 * @property {Object.<string, *>} [properties] - Feature properties
 */

/**
 * @typedef {Object} GeoJSONFeatureCollection
 * @property {'FeatureCollection'} type - Must be 'FeatureCollection'
 * @property {GeoJSONFeature[]} features - Array of features
 */

/**
 * @typedef {GeoJSONFeature|GeoJSONFeatureCollection} GeoJSONData
 */

/**
 * @typedef {Object} SSEVectorSourceStats
 * @property {number} messagesReceived - Total SSE messages received
 * @property {number} mapUpdates - Total map update operations
 * @property {Date|null} lastUpdateTime - Timestamp of last update
 * @property {Date|null} connectionTime - Timestamp when connection was established
 */

/**
 * @typedef {Object} SSEVectorSourceOptions
 * @property {string} [sseUrl] - SSE endpoint URL
 * @property {string} [eventType='message'] - SSE event type to listen for
 * @property {string} [dataProjection='EPSG:4326'] - Projection of incoming data
 * @property {string} [featureProjection='EPSG:3857'] - Target projection for features
 * @property {number} [updateInterval=100] - Rate limiting interval in milliseconds
 * @property {boolean} [useFeatureIds=true] - Whether to track features by ID
 * @property {string} [idPrefix='feature:'] - Prefix for feature IDs
 * @property {function(): void} [onConnectionOpen] - Callback when connection opens
 * @property {function(Event): void} [onConnectionError] - Callback on connection error
 * @property {function(GeoJSONData): void} [onMessage] - Callback when message is received
 */

/**
 * OpenLayers VectorSource that receives features from a Server-Sent Events (SSE) endpoint.
 * Supports rate-limiting, automatic reprojection, and feature tracking by ID.
 *
 * @extends VectorSource
 */
class SSEVectorSource extends VectorSource {
  /**
   * Creates a new SSEVectorSource.
   *
   * @param {SSEVectorSourceOptions} [options={}] - Configuration options
   */
  constructor (options = {}) {
    /** @type {{ resolution?: number }} */
    const state = {}

    const params = {
      features: [],
      useSpatialIndex: false,
      /**
       * @param {import('ol/extent').Extent} extent - Current extent
       * @param {number} resolution - Current resolution
       * @returns {import('ol/extent').Extent[]} - Extents to load
       */
      strategy: function (extent, resolution) {
        if (state.resolution !== resolution) {
          state.resolution = resolution
          this.getFeatures().map(feature => feature.$.centerResolution(resolution))
        }
        return [extent]
      }
    }

    super({ ...options, ...params })

    /**
     * SSE endpoint URL
     * @type {string|undefined}
     */
    this.sseUrl = options.sseUrl

    /**
     * Rate limiting interval in milliseconds
     * @type {number}
     */
    this.updateInterval = options.updateInterval || 100

    /**
     * Projection of incoming data
     * @type {string}
     */
    this.dataProjection = options.dataProjection || 'EPSG:4326'

    /**
     * Target projection for features on the map
     * @type {string}
     */
    this.featureProjection = options.featureProjection || 'EPSG:3857'

    /**
     * SSE event type to listen for
     * @type {string}
     */
    this.eventType = options.eventType || 'message'

    /**
     * Whether to track features by ID (update existing) or replace all features
     * @type {boolean}
     */
    this.useFeatureIds = options.useFeatureIds !== false

    /**
     * Prefix added to feature IDs
     * @type {string}
     */
    this.idPrefix = options.idPrefix || 'feature:'

    /**
     * Function to convert GeoJSON to OpenLayers Feature
     * @type {function(GeoJSONFeature): Feature}
     */
    this.featureReader = readFeature({
      styles: {
        [ID.defaultStyleId]: defaultStyle
      }
    })

    /**
     * Pending GeoJSON data waiting to be processed
     * @type {GeoJSONData|null}
     */
    this.pendingData = null

    /**
     * Timestamp of last update (ms since epoch)
     * @type {number}
     */
    this.lastUpdate = 0

    /**
     * Timer ID for scheduled updates
     * @type {ReturnType<typeof setTimeout>|null}
     */
    this.timerId = null

    /**
     * Connection and update statistics
     * @type {SSEVectorSourceStats}
     */
    this.stats = {
      messagesReceived: 0,
      mapUpdates: 0,
      lastUpdateTime: null,
      connectionTime: null
    }

    /**
     * EventSource connection instance
     * @type {EventSource|null}
     */
    this.eventSource = null

    /**
     * Callback when connection opens
     * @type {function(): void|null}
     */
    this.onConnectionOpen = options.onConnectionOpen || null

    /**
     * Callback on connection error
     * @type {function(Event): void|null}
     */
    this.onConnectionError = options.onConnectionError || null

    /**
     * Callback when message is received
     * @type {function(GeoJSONData): void|null}
     */
    this.onMessage = options.onMessage || null

    // Auto-connect if URL is provided
    if (this.sseUrl) {
      this.connect()
    }
  }

  /**
   * Establishes SSE connection to the configured URL.
   * If already connected, disconnects first.
   *
   * @returns {void}
   */
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
        /** @type {GeoJSONData} */
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

  /**
   * Closes the SSE connection and clears any pending timers.
   *
   * @returns {void}
   */
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

  /**
   * Schedules a feature update with rate limiting.
   * If enough time has passed since last update, flushes immediately.
   * Otherwise, schedules a delayed update.
   *
   * @param {GeoJSONData} data - GeoJSON data to process
   * @returns {void}
   */
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

  /**
   * Processes pending GeoJSON data and updates the map features.
   * Handles both Feature and FeatureCollection types.
   *
   * @returns {void}
   */
  flushUpdate () {
    if (!this.pendingData) {
      return
    }

    try {
      /** @type {GeoJSONFeature[]} */
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

  /**
   * Reprojects a GeoJSON geometry from dataProjection to featureProjection.
   *
   * @param {GeoJSONGeometry} geometry - GeoJSON geometry to reproject
   * @returns {GeoJSONGeometry} Reprojected geometry
   */
  reprojectGeometry (geometry) {
    if (this.dataProjection === this.featureProjection) {
      return geometry
    }
    return reproject(geometry, this.dataProjection, this.featureProjection)
  }

  /**
   * Replaces all features with new ones (for sources without IDs).
   * Clears existing features and adds reprojected new features.
   *
   * @param {GeoJSONFeature[]} features - Array of GeoJSON features
   * @returns {void}
   */
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

  /**
   * Updates existing features or adds new ones based on feature ID.
   * Features without IDs are skipped with a warning.
   *
   * @param {GeoJSONFeature[]} features - Array of GeoJSON features with IDs
   * @returns {void}
   */
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

  /**
   * Sets the rate limiting interval for updates.
   *
   * @param {number} interval - Update interval in milliseconds
   * @returns {void}
   */
  setUpdateInterval (interval) {
    this.updateInterval = interval
  }

  /**
   * Returns current statistics including connection status and feature count.
   *
   * @returns {{
   *   messagesReceived: number,
   *   mapUpdates: number,
   *   lastUpdateTime: Date|null,
   *   connectionTime: Date|null,
   *   isConnected: boolean,
   *   featureCount: number
   * }} Statistics object
   */
  getStats () {
    return {
      ...this.stats,
      isConnected: this.isConnected(),
      featureCount: this.getFeatures().length
    }
  }

  /**
   * Checks if the SSE connection is currently open.
   *
   * @returns {boolean} True if connected
   */
  isConnected () {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN
  }

  /**
   * Disposes the source, disconnecting SSE and cleaning up resources.
   *
   * @returns {void}
   */
  dispose () {
    this.disconnect()
    super.dispose()
  }
}

export default SSEVectorSource
