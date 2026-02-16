/* eslint-disable react/prop-types */
import React from 'react'
import TextField from './TextField'
import Range from './Range'
import FlexColumnGap from './FlexColumnGap'
import Name from './Name'
import { useServices } from '../hooks'
import { Tooltip } from 'react-tooltip'
import './SSEServiceProperties.css'

/**
 * Displays the connection status indicator (green/gray dot with text).
 * Polls independently so re-renders don't affect the parent form.
 */
const SSEConnectionStatus = ({ sseLayerStore, serviceKey }) => {
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const check = () => {
      if (sseLayerStore) {
        const stats = sseLayerStore.getServiceStats(serviceKey)
        setConnected(!!stats.isConnected)
      }
    }
    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [serviceKey, sseLayerStore])

  const className = connected
    ? 'sse-status sse-status--connected'
    : 'sse-status sse-status--disconnected'

  return (
    <div className={className}>
      <span className='sse-status-indicator'></span>
      <span>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  )
}

/**
 * Displays live stats (feature count, messages, updates).
 * Polls independently so re-renders don't affect the parent form.
 */
const SSEServiceStatsPanel = ({ sseLayerStore, serviceKey }) => {
  const [stats, setStats] = React.useState(null)

  React.useEffect(() => {
    const update = () => {
      if (sseLayerStore) {
        setStats(sseLayerStore.getServiceStats(serviceKey))
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [serviceKey, sseLayerStore])

  if (!stats?.isConnected) return null

  return (
    <div className='sse-stats'>
      <div className='sse-stat'>
        <span className='sse-stat-label'>Features:</span>
        <span className='sse-stat-value'>{stats.featureCount}</span>
      </div>
      <div className='sse-stat'>
        <span className='sse-stat-label'>Messages:</span>
        <span className='sse-stat-value'>{stats.messagesReceived}</span>
      </div>
      <div className='sse-stat'>
        <span className='sse-stat-label'>Updates:</span>
        <span className='sse-stat-value'>{stats.mapUpdates}</span>
      </div>
    </div>
  )
}

const SSEServiceProperties = props => {
  const { sseLayerStore, store } = useServices()
  const [key, service] = (Object.entries(props.features))[0]
  const [url, setUrl] = React.useState({ dirty: false, value: service.url || '' })
  const [eventType, setEventType] = React.useState({ dirty: false, value: service.eventType || 'message' })
  const [updateInterval, setUpdateInterval] = React.useState({ dirty: false, value: service.updateInterval || 100 })
  const [heatmapRadius, setHeatmapRadius] = React.useState({ dirty: false, value: service.heatmapRadius ?? 20 })
  const [heatmapBlur, setHeatmapBlur] = React.useState({ dirty: false, value: service.heatmapBlur ?? 15 })
  const [heatmapOpacity, setHeatmapOpacity] = React.useState({ dirty: false, value: service.heatmapOpacity ?? 0.75 })
  const [heatmapInterval, setHeatmapInterval] = React.useState({ dirty: false, value: service.heatmapInterval ?? 1000 })
  const [maxHeatmapFeatures, setMaxHeatmapFeatures] = React.useState({ dirty: false, value: service.maxHeatmapFeatures ?? 50000 })
  const [vectorOpacity, setVectorOpacity] = React.useState({ dirty: false, value: service.vectorOpacity ?? 1 })
  const [connected, setConnected] = React.useState(false)

  const renderMode = service.renderMode || 'vector'
  const isHeatmap = renderMode === 'heatmap'

  // Track connection status as a primitive boolean.
  // React skips re-renders when the value hasn't changed,
  // so this won't cause re-renders during steady streaming.
  React.useEffect(() => {
    const checkConnection = () => {
      if (sseLayerStore) {
        const stats = sseLayerStore.getServiceStats(key)
        setConnected(!!stats.isConnected)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [key, sseLayerStore])

  // Reset local state only when selecting a different service
  React.useEffect(() => {
    setUrl({ dirty: false, value: service.url || '' })
    setEventType({ dirty: false, value: service.eventType || 'message' })
    setUpdateInterval({ dirty: false, value: service.updateInterval || 100 })
    setHeatmapRadius({ dirty: false, value: service.heatmapRadius ?? 20 })
    setHeatmapBlur({ dirty: false, value: service.heatmapBlur ?? 15 })
    setHeatmapOpacity({ dirty: false, value: service.heatmapOpacity ?? 0.75 })
    setHeatmapInterval({ dirty: false, value: service.heatmapInterval ?? 1000 })
    setMaxHeatmapFeatures({ dirty: false, value: service.maxHeatmapFeatures ?? 50000 })
    setVectorOpacity({ dirty: false, value: service.vectorOpacity ?? 1 })
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateService = async (updates) => {
    // Read current value from store to avoid stale closure issues
    const [currentService] = await store.values(key)
    const newValue = { ...currentService, ...updates }
    store.update([key], [newValue], [currentService])
  }

  const handleUrlChange = ({ target }) => {
    if (url.value === target.value) return
    setUrl({ dirty: true, value: target.value })
  }

  const handleUrlBlur = () => {
    if (!url.dirty) return
    setUrl({ dirty: false, value: url.value })
    updateService({ url: url.value })
  }

  const handleEventTypeChange = ({ target }) => {
    if (eventType.value === target.value) return
    setEventType({ dirty: true, value: target.value })
  }

  const handleEventTypeBlur = () => {
    if (!eventType.dirty) return
    setEventType({ dirty: false, value: eventType.value })
    updateService({ eventType: eventType.value })
  }

  const handleUpdateIntervalChange = ({ target }) => {
    const value = parseInt(target.value, 10) || 100
    if (updateInterval.value === value) return
    setUpdateInterval({ dirty: true, value })
  }

  const handleUpdateIntervalBlur = () => {
    if (!updateInterval.dirty) return
    setUpdateInterval({ dirty: false, value: updateInterval.value })
    updateService({ updateInterval: updateInterval.value })
  }

  const handleRenderModeChange = (mode) => {
    if (mode === renderMode) return
    updateService({ renderMode: mode })
  }

  const handleHeatmapRadiusChange = ({ target }) => {
    const value = parseInt(target.value, 10) || 20
    if (heatmapRadius.value === value) return
    setHeatmapRadius({ dirty: true, value })
  }

  const handleHeatmapRadiusBlur = () => {
    if (!heatmapRadius.dirty) return
    setHeatmapRadius({ dirty: false, value: heatmapRadius.value })
    updateService({ heatmapRadius: heatmapRadius.value })
  }

  const handleHeatmapBlurChange = ({ target }) => {
    const value = parseInt(target.value, 10) || 15
    if (heatmapBlur.value === value) return
    setHeatmapBlur({ dirty: true, value })
  }

  const handleHeatmapBlurBlur = () => {
    if (!heatmapBlur.dirty) return
    setHeatmapBlur({ dirty: false, value: heatmapBlur.value })
    updateService({ heatmapBlur: heatmapBlur.value })
  }

  const handleHeatmapOpacityChange = ({ target }) => {
    const value = Number.parseFloat(target.value)
    setHeatmapOpacity({ dirty: false, value })
    updateService({ heatmapOpacity: value })
  }

  const handleHeatmapIntervalChange = ({ target }) => {
    const value = parseInt(target.value, 10) || 1000
    if (heatmapInterval.value === value) return
    setHeatmapInterval({ dirty: true, value })
  }

  const handleHeatmapIntervalBlur = () => {
    if (!heatmapInterval.dirty) return
    setHeatmapInterval({ dirty: false, value: heatmapInterval.value })
    updateService({ heatmapInterval: heatmapInterval.value })
  }

  const handleMaxHeatmapFeaturesChange = ({ target }) => {
    const value = parseInt(target.value, 10) || 50000
    if (maxHeatmapFeatures.value === value) return
    setMaxHeatmapFeatures({ dirty: true, value })
  }

  const handleMaxHeatmapFeaturesBlur = () => {
    if (!maxHeatmapFeatures.dirty) return
    setMaxHeatmapFeatures({ dirty: false, value: maxHeatmapFeatures.value })
    updateService({ maxHeatmapFeatures: maxHeatmapFeatures.value })
  }

  const handleVectorOpacityChange = ({ target }) => {
    const value = Number.parseFloat(target.value)
    setVectorOpacity({ dirty: false, value })
    updateService({ vectorOpacity: value })
  }

  const handleEnabledChange = ({ target }) => {
    updateService({ enabled: target.checked })
  }

  const handleUseFeatureIdsChange = ({ target }) => {
    updateService({ useFeatureIds: target.checked })
  }

  const isConnected = service.enabled && connected

  return (
    <FlexColumnGap>
      <Name {...props}/>

      <TextField
        id='sse-url'
        label='URL'
        value={url.value}
        disabled={isConnected}
        onChange={handleUrlChange}
        onBlur={handleUrlBlur}
      />
      <Tooltip anchorSelect='#sse-url' content='Live data endpoint URL' delayShow={750} />

      <TextField
        id='sse-event-type'
        label='Event Type'
        value={eventType.value}
        disabled={isConnected}
        onChange={handleEventTypeChange}
        onBlur={handleEventTypeBlur}
      />
      <Tooltip anchorSelect='#sse-event-type' content='Event type to listen for (default: message)' delayShow={750} />

      <TextField
        id='sse-update-interval'
        label='Update Interval (ms)'
        type='number'
        min='10'
        value={updateInterval.value}
        onChange={handleUpdateIntervalChange}
        onBlur={handleUpdateIntervalBlur}
      />
      <Tooltip anchorSelect='#sse-update-interval' content='Rate limiting interval in milliseconds' delayShow={750} />

      <div className='sse-render-mode'>
        <span className='sse-section-label'>Render Mode</span>
        <div className='sse-radio-group'>
          <label className='sse-radio-label'>
            <input
              type='radio'
              name={`renderMode-${key}`}
              value='vector'
              checked={!isHeatmap}
              disabled={isConnected}
              onChange={() => handleRenderModeChange('vector')}
            />
            <span>Vector</span>
          </label>
          <label className='sse-radio-label'>
            <input
              type='radio'
              name={`renderMode-${key}`}
              value='heatmap'
              checked={isHeatmap}
              disabled={isConnected}
              onChange={() => handleRenderModeChange('heatmap')}
            />
            <span>Heatmap</span>
          </label>
        </div>
      </div>
      <Tooltip anchorSelect='.sse-render-mode' content='Vector shows individual features, Heatmap shows accumulated detection density' delayShow={750} />

      {isHeatmap && (
        <>
          <label className='sse-section-label'>Opacity</label>
          <Range
            min='0'
            max='1'
            step='0.05'
            value={heatmapOpacity.value}
            onChange={handleHeatmapOpacityChange}
          >
            <option value='0'>0%</option>
            <option value='1'>100%</option>
          </Range>

          <TextField
            id='sse-heatmap-radius'
            label='Radius (px)'
            type='number'
            min='1'
            value={heatmapRadius.value}
            onChange={handleHeatmapRadiusChange}
            onBlur={handleHeatmapRadiusBlur}
          />
          <Tooltip anchorSelect='#sse-heatmap-radius' content='Pixel radius for each heatmap point' delayShow={750} />

          <TextField
            id='sse-heatmap-blur'
            label='Blur (px)'
            type='number'
            min='1'
            value={heatmapBlur.value}
            onChange={handleHeatmapBlurChange}
            onBlur={handleHeatmapBlurBlur}
          />
          <Tooltip anchorSelect='#sse-heatmap-blur' content='Pixel blur around each heatmap point' delayShow={750} />

          <TextField
            id='sse-heatmap-interval'
            label='Accumulation Interval (ms)'
            type='number'
            min='100'
            value={heatmapInterval.value}
            onChange={handleHeatmapIntervalChange}
            onBlur={handleHeatmapIntervalBlur}
          />
          <Tooltip anchorSelect='#sse-heatmap-interval' content='How often detection points are added to the heatmap (slower = less dense)' delayShow={750} />

          <TextField
            id='sse-max-heatmap-features'
            label='History Size'
            type='number'
            min='1000'
            value={maxHeatmapFeatures.value}
            onChange={handleMaxHeatmapFeaturesChange}
            onBlur={handleMaxHeatmapFeaturesBlur}
          />
          <Tooltip anchorSelect='#sse-max-heatmap-features' content='Number of detection points kept in the heatmap. Oldest points are discarded when this limit is reached.' delayShow={750} />
        </>
      )}

      {!isHeatmap && (
        <>
          <label className='sse-section-label'>Opacity</label>
          <Range
            min='0'
            max='1'
            step='0.05'
            value={vectorOpacity.value}
            onChange={handleVectorOpacityChange}
          >
            <option value='0'>0%</option>
            <option value='1'>100%</option>
          </Range>

          <div className='sse-option-row'>
            <label className='sse-option-label'>
              <input
                type='checkbox'
                checked={service.useFeatureIds !== false}
                disabled={isConnected}
                onChange={handleUseFeatureIdsChange}
              />
              <span>Track features by ID</span>
            </label>
          </div>
          <Tooltip anchorSelect='.sse-option-row' content='When enabled, features are updated by ID. When disabled, all features are replaced on each update.' delayShow={750} />
        </>
      )}

      <div className='sse-enabled-row'>
        <label className='sse-enabled-label'>
          <input
            type='checkbox'
            checked={service.enabled || false}
            onChange={handleEnabledChange}
          />
          <span>Enabled</span>
        </label>
        <SSEConnectionStatus sseLayerStore={sseLayerStore} serviceKey={key} />
      </div>

      <SSEServiceStatsPanel sseLayerStore={sseLayerStore} serviceKey={key} />
    </FlexColumnGap>
  )
}

export default SSEServiceProperties
