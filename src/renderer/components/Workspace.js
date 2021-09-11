import React from 'react'
import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import { propertiesPartition, geometryPartition, preferencesPartition } from '../../shared/stores'
import EventEmitter from '../../shared/emitter'
import { SessionStore, Store, SearchIndex, PreferencesStore } from '../store'
import { Sources, PaletteCommands } from '../model'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { bindings } from '../commands/bindings'
import { Map } from './Map'
import { CommandPalette, Sidebar } from '.'
import { useServices, ServiceProvider } from './services'


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


/**
 *
 */
export const workspace = projectUUID => {
  const selection = new Selection()
  const undo = new Undo()

  const databases = (() => {
    const entry = process.argv.find(s => s.startsWith('--databases='))
    if (entry) return entry.split('=')[1]
  })()

  const location = path.join(databases, projectUUID)
  const db = levelup(leveldown(location))
  const propertiesLevel = propertiesPartition(db)
  const geometryLevel = geometryPartition(db)
  const preferencesLevel = preferencesPartition(db)
  const store = new Store(propertiesLevel, geometryLevel, undo, selection)
  const preferencesStore = new PreferencesStore(preferencesLevel)
  const searchIndex = new SearchIndex(propertiesLevel)
  const emitter = new EventEmitter()

  // Key bindings.
  bindings(emitter)

  const inputTypes = [HTMLInputElement, HTMLTextAreaElement]
  const activeElement = () => document.activeElement
  const inputFocused = () => inputTypes.some(type => (activeElement() instanceof type))

  ipcRenderer.on('EDIT_UNDO', () => {
    if (inputFocused()) return ipcRenderer.send('DO_UNDO')
    console.log('canUndo', undo.canUndo())
    if (undo.canUndo()) undo.undo()
  })

  ipcRenderer.on('EDIT_REDO', () => {
    if (inputFocused()) return ipcRenderer.send('DO_REDO')
    console.log('canRedo', undo.canRedo())
    if (undo.canRedo()) undo.redo()
  })

  const dragAndDrop = new DragAndDrop()

  dragAndDrop.on('layers', async ({ layers }) => {
    await store.importLayers(layers)
  })

  const services = {}
  services.emitter = emitter
  services.ipcRenderer = ipcRenderer
  services.master = levelup(new IPCDownClient(ipcRenderer))
  services.sessionStore = new SessionStore(services.master, `project:${projectUUID}`)
  services.undo = undo
  services.sources = new Sources(store, selection)
  services.selection = selection
  services.dragAndDrop = dragAndDrop
  services.store = store
  services.preferencesStore = preferencesStore
  services.searchIndex = searchIndex
  services.paletteCommands = new PaletteCommands(store, emitter)

  return (
    <ServiceProvider { ...services }>
      <Workspace/>
    </ServiceProvider>
  )
}

const handlers = {
  sidebar: (state, { showing, group }) => ({
    ...state,
    sidebar: {
      showing,
      group: group || state.sidebar.group
    }
  }),
  palette: (state, { showing, value, placeholder, callback }) => ({
    ...state,
    palette: {
      showing,
      value,
      placeholder,
      callback
    }
  })
}

const reducer = (state, event) => {
  const handler = handlers[event.type]
  if (handler) return handler(state, event)
  else return state
}

/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Workspace = () => {
  const { emitter } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {
    palette: { showing: false },
    properties: false,
    sidebar: { showing: true, group: 'symbol' }
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
        case 'toggle-sidebar': return dispatch({
          type: 'sidebar',
          showing: !state.sidebar.showing,
          group: state.sidebar.group
        })
        case 'sidebar-layer': return dispatch({
          type: 'sidebar',
          showing: true,
          group: 'layer'
        })
        case 'sidebar-symbol': return dispatch({
          type: 'sidebar',
          showing: true,
          group: 'symbol'
        })
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [state.sidebar, emitter, dispatch])

  const palette = state.palette.showing &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
      value={state.palette.value}
      placeholder={state.palette.placeholder}
      callback={state.palette.callback}
    />

  const sidebar = state.sidebar.showing &&
    <div className="panel-left panel">
      <Sidebar group={scopeGroups[state.sidebar.group]}/>
    </div>

  return (
    <>
      <Map/>
      <div className='panel-container fullscreen'>
        {/* <div className="osd panel-top"/> */}
        { sidebar }
        {/* <div className="panel-right panel"></div> */}
      </div>
      { palette }
    </>
  )
}
