import React from 'react'
import { Map } from './map/Map'
import { CommandPalette, Sidebar, FeatureProperties } from '.'
import { Toolbar } from './Toolbar'
import { Statusbar } from './Statusbar'
import { useServices, useMemento } from './hooks'
import './Project.css'

const scopeGroup = {
  key: 'layer',
  scope: '@layer',
  label: 'Layers',
  items: [
    { key: 'layer', scope: '@layer', label: 'Layers' },
    { key: 'feature', scope: '@feature', label: 'Features' },
    { key: 'link', scope: '@link', label: 'Links' },
    { key: 'symbol', scope: '@symbol', label: 'Symbols' },
    { key: 'marker', scope: '@marker', label: 'Markers' },
    { key: 'pinned', scope: '#pin', label: 'Pinned' }
  ]
}

const handlers = {
  palette: (state, palette) => ({ ...state, palette })
}

const reducer = (state, event) => {
  const handler = handlers[event.type]
  if (handler) return handler(state, event)
  else return state
}

/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Project = () => {
  const { emitter } = useServices()
  const sidebarMemento = useMemento('ui.sidebar', { showing: true, group: 'layer' })

  const [state, dispatch] = React.useReducer(reducer, {
    palette: { showing: false },
    properties: false
  })

  const handleCommandPaletteBlur = () => dispatch({ type: 'palette', showing: false })
  const handleCommandPaletteKeyDown = ({ key }) => {
    if (key === 'Escape') dispatch({ type: 'palette', showing: false })
    if (key === 'Enter') dispatch({ type: 'palette', showing: false })
  }

  React.useEffect(() => {
    const handleCommand = event => {

      switch (event.type) {
        case 'open-command-palette': {
          return dispatch({
            type: 'palette',
            showing: true,
            value: event.value,
            placeholder: event.placeholder,
            callback: event.callback
          })
        }
        case 'toggle-sidebar': return sidebarMemento.put({
          showing: !sidebarMemento.value.showing,
          group: sidebarMemento.value.group
        })
        case 'sidebar-layer': return sidebarMemento.put({
          showing: true,
          group: 'layer'
        })
        case 'sidebar-symbol': return sidebarMemento.put({
          showing: true,
          group: 'symbol'
        })
        case 'sidebar-location': return sidebarMemento.put({
          showing: true,
          group: 'location'
        })
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [emitter, sidebarMemento])

  const palette = state.palette.showing &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
      value={state.palette.value}
      placeholder={state.palette.placeholder}
      callback={state.palette.callback}
    />

  const sidebar = sidebarMemento.value && sidebarMemento.value.showing &&
    <div className="sidebar">
      <Sidebar group={scopeGroup}/>
    </div>

  return (
    <>
      <Toolbar/>
      <div className='sidebar-container'>
        { sidebar }
        <div className='map-controls' id='map-controls'/>
      </div>
      <FeatureProperties/>
      { palette }
      <Map/>
      <Statusbar/>
    </>
  )
}
