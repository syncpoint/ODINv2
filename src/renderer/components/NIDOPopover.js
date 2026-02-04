import React from 'react'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import { Tooltip } from 'react-tooltip'
import { useServices, useMemento } from './hooks'
import './NIDOPopover.css'

export const NIDOPopover = () => {
  const { wsClient, preferencesStore } = useServices()
  const [url] = useMemento('api.websocket.url', '')
  const [enabled] = useMemento('api.websocket.enabled', false)
  const [localUrl, setLocalUrl] = React.useState({ dirty: false, value: '' })
  const [status, setStatus] = React.useState({ connected: false })
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef(null)

  // Sync local URL state with stored preference
  React.useEffect(() => {
    setLocalUrl({ dirty: false, value: url || '' })
  }, [url])

  // Subscribe to WebSocket status changes
  React.useEffect(() => {
    if (!wsClient) {
      setStatus({ connected: false })
      return
    }

    const handleStatus = (newStatus) => setStatus(newStatus)
    setStatus(wsClient.getStatus())
    wsClient.on('status', handleStatus)
    return () => wsClient.off('status', handleStatus)
  }, [wsClient])

  // Handle enable/disable toggle
  React.useEffect(() => {
    if (!wsClient) return

    if (enabled && url) {
      if (!wsClient.isConnected()) {
        wsClient.connect(url)
      }
    } else {
      if (wsClient.isConnected()) {
        wsClient.disconnect()
      }
    }
  }, [enabled, url, wsClient])

  // Click outside to close
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    // Delay adding listener to avoid immediate close from the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleUrlChange = ({ target }) => {
    if (localUrl.value === target.value) return
    setLocalUrl({ dirty: true, value: target.value })
  }

  const handleUrlBlur = async () => {
    if (!localUrl.dirty) return
    setLocalUrl({ dirty: false, value: localUrl.value })
    await preferencesStore.put('api.websocket.url', localUrl.value)
  }

  const handleUrlKeyDown = (event) => {
    if (event.key === 'Enter') handleUrlBlur()
  }

  const handleEnabledChange = async ({ target }) => {
    await preferencesStore.put('api.websocket.enabled', target.checked)
  }

  const toggleOpen = () => setOpen(current => !current)

  // Badge state
  const badgeClass = status.connected
    ? 'connected'
    : enabled
      ? 'failed'
      : 'disconnected'

  const statusText = status.connected
    ? 'Connected'
    : enabled
      ? 'Connection failed'
      : 'Disconnected'

  return (
    <div className="nido-popover" ref={containerRef}>
      <button
        id="nido-popover-button"
        className={`nido-popover__button ${open ? 'nido-popover__button--open' : ''}`}
        onClick={toggleOpen}
      >
        <Icon path={mdi.mdiLan} size="20px" />
        <span className={`nido-popover__badge nido-popover__badge--${badgeClass}`} />
      </button>

      {open && (
        <div className="nido-popover__content">
          <div className="nido-popover__header">
            <span className="nido-popover__title">NIDO Connection</span>
            <span className={`nido-popover__status nido-popover__status--${badgeClass}`}>
              {statusText}
            </span>
          </div>

          <div className="nido-popover__field">
            <label htmlFor="nido-url">WebSocket URL</label>
            <input
              id="nido-url"
              type="text"
              value={localUrl.value}
              placeholder="ws://localhost:9000"
              disabled={status.connected}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              onKeyDown={handleUrlKeyDown}
            />
          </div>

          <div className="nido-popover__toggle">
            <label>
              <input
                type="checkbox"
                checked={enabled || false}
                disabled={!localUrl.value}
                onChange={handleEnabledChange}
              />
              <span>Enable connection</span>
            </label>
          </div>

          {status.connected && wsClient?.clientId && (
            <div className="nido-popover__info">
              Client ID: {wsClient.clientId.substring(0, 8)}...
            </div>
          )}

          <div className="nido-popover__description">
            NIDO enables external applications to sync with this project in real-time.
            Connected tools can receive live updates and send commands to create,
            modify, or delete features.
          </div>
        </div>
      )}

      {!open && (
        <Tooltip
          anchorSelect="#nido-popover-button"
          content="Connect to external applications (NIDO)"
          style={{ zIndex: 200 }}
          delayShow={750}
        />
      )}
    </div>
  )
}
