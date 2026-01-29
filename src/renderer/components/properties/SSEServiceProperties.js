/* eslint-disable react/prop-types */
import React from 'react'
import TextField from './TextField'
import FlexColumnGap from './FlexColumnGap'
import Name from './Name'
import { useServices } from '../hooks'
import { Tooltip } from 'react-tooltip'
import './SSEServiceProperties.css'

const SSEServiceProperties = props => {
  const { sseLayerStore, store } = useServices()
  const [key, service] = (Object.entries(props.features))[0]
  const [url, setUrl] = React.useState({ dirty: false, value: service.url || '' })
  const [eventType, setEventType] = React.useState({ dirty: false, value: service.eventType || 'message' })
  const [updateInterval, setUpdateInterval] = React.useState({ dirty: false, value: service.updateInterval || 100 })
  const [stats, setStats] = React.useState({ isConnected: false, featureCount: 0 })

  // Update stats periodically
  React.useEffect(() => {
    const updateStats = () => {
      if (sseLayerStore) {
        setStats(sseLayerStore.getServiceStats(key))
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 1000)
    return () => clearInterval(interval)
  }, [key, sseLayerStore])

  // Reset local state only when selecting a different service
  React.useEffect(() => {
    setUrl({ dirty: false, value: service.url || '' })
    setEventType({ dirty: false, value: service.eventType || 'message' })
    setUpdateInterval({ dirty: false, value: service.updateInterval || 100 })
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

  const handleEnabledChange = ({ target }) => {
    updateService({ enabled: target.checked })
  }

  const handleUseFeatureIdsChange = ({ target }) => {
    updateService({ useFeatureIds: target.checked })
  }

  const connectionStatusClass = stats.isConnected
    ? 'sse-status sse-status--connected'
    : 'sse-status sse-status--disconnected'

  const connectionStatusText = stats.isConnected ? 'Connected' : 'Disconnected'
  const isConnected = service.enabled && stats.isConnected

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

      <div className='sse-enabled-row'>
        <label className='sse-enabled-label'>
          <input
            type='checkbox'
            checked={service.enabled || false}
            onChange={handleEnabledChange}
          />
          <span>Enabled</span>
        </label>
        <div className={connectionStatusClass}>
          <span className='sse-status-indicator'></span>
          <span>{connectionStatusText}</span>
        </div>
      </div>

      {stats.isConnected && (
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
      )}
    </FlexColumnGap>
  )
}

export default SSEServiceProperties
