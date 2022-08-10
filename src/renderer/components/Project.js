import React from 'react'
import { Map } from './map/Map'
import { Properties } from './properties/Properties'
import { CommandPalette } from './commandpalette/CommandPalette'
import { Sidebar } from './sidebar/Sidebar'
import { Toolbar } from './Toolbar'
import { OSD } from './OSD'
import { useServices, useMemento } from './hooks'
import './Project.css'

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
  const [sidebarShowing] = useMemento('ui.sidebar.showing', true)
  const [toolbarShowing] = useMemento('ui.toolbar.showing', true)

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
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [emitter])

  const sidebar = sidebarShowing ? <Sidebar/> : null
  const toolbar = toolbarShowing ? <Toolbar/> : null

  const palette = state.palette.showing &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
      value={state.palette.value}
      placeholder={state.palette.placeholder}
      callback={state.palette.callback}
    />

  return (
    <div className="site-container">
      { toolbar }
      <div className="content">
        { palette }
        <Map/>
        <div className="map-overlay">
          { sidebar }
          <OSD/>
          <Properties/>
        </div>
      </div>
    </div>
  )
}
