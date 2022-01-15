import React from 'react'
import { Map } from './Map'
import { CommandPalette, Sidebar, FeatureProperties } from '.'
import { useServices, useMemento } from './hooks'

/**
 * Groups of related scopes.
 */
const scopeGroups = {
  layer: {
    key: 'layer',
    scope: '@id:layer',
    label: 'Layers',
    items: [
      { key: 'layer', scope: '@id:layer', label: 'Layers' },
      { key: 'feature', scope: '@id:feature', label: 'Features' },
      { key: 'link', scope: '@id:link', label: 'Links' },
      { key: 'view', scope: '@id:view', label: 'Views' },
      // Tag #pin and any of given scopes:
      { key: 'pinned', scope: '@id:layer|feature|link|view #pin', label: 'Pinned' }
    ]
  },
  symbol: {
    key: 'symbol',
    scope: '@id:symbol',
    label: 'Symbols',
    items: [
      { key: 'symbol', scope: '@id:symbol', label: 'Symbols' },
      { key: 'pinned', scope: '@id:symbol #pin', label: 'Pinned' }
    ]
  }
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
    <div className="panel-left panel">
      <Sidebar group={scopeGroups[sidebarMemento.value.group]}/>
    </div>

  return (
    <>
      <Map/>
      <div className='panel-container fullscreen'>
        {/* <div className="osd panel-top"/> */}
        { sidebar }
        <FeatureProperties></FeatureProperties>
      </div>
      { palette }
    </>
  )
}
