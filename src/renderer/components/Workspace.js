import React from 'react'
import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import { propertiesPartition, geometryPartition } from '../../shared/stores'
import EventEmitter from '../../shared/emitter'
import { SessionStore, Store, SearchIndex } from '../store'
import { Sources, PaletteCommands } from '../model'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { bindings } from '../commands/bindings'
import { Map } from './Map'
import { CommandPalette, Layers } from '.'
import { useServices, ServiceProvider } from './services'


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
  const store = new Store(propertiesLevel, geometryLevel, undo, selection)
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
  services.searchIndex = searchIndex
  services.paletteCommands = new PaletteCommands(store, emitter)

  return (
    <ServiceProvider { ...services }>
      <Workspace/>
    </ServiceProvider>
  )
}

/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Workspace = () => {
  const { emitter } = useServices()
  const [showing, setShowing] = React.useState({
    spotlight: false,
    properties: false,
    sidebar: true
  })

  const handleCommandPaletteBlur = () => setShowing({ ...showing, spotlight: false })
  const handleCommandPaletteKeyDown = ({ key }) => {
    if (key === 'Escape') setShowing({ ...showing, spotlight: false })
    if (key === 'Enter') setShowing({ ...showing, spotlight: false })
  }

  React.useEffect(() => {
    const handleCommand = event => {

      switch (event.type) {
        case 'open-command-palette': {
          return setShowing({
            ...showing,
            spotlight: true,
            paletteValue: event.value,
            palettePlaceholder: event.placeholder,
            paletteCallback: event.callback
          })
        }
        case 'toggle-sidebar': return setShowing({ ...showing, sidebar: !showing.sidebar })
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [emitter, showing])

  const spotlight = showing.spotlight &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
      value={showing.paletteValue}
      placeholder={showing.palettePlaceholder}
      callback={showing.paletteCallback}
    />

  const sidebar = showing.sidebar &&
    <div className="panel-left panel">
      <Layers/>
    </div>

  return (
    <>
      <Map/>
      <div className='panel-container fullscreen'>
        {/* <div className="osd panel-top"/> */}
        { sidebar }
        {/* <div className="panel-right panel"></div> */}
      </div>
      { spotlight }
    </>
  )
}
