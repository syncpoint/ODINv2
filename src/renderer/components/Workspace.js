import React from 'react'
import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import { propertyPartition, geometryPartition } from '../../shared/stores'
import EventEmitter from '../../shared/emitter'
import { SessionStore, LayerStore, SearchIndex } from '../store'
import { Sources, PaletteCommands } from '../model'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { CommandRegistry } from '../commands/CommandRegistry'
import { Map } from './Map'
import { CommandPalette } from './CommandPalette'
import { useServices, ServiceProvider } from './services'


/**
 *
 */
export const workspace = projectUUID => {
  const undo = new Undo()

  const databases = (() => {
    const entry = process.argv.find(s => s.startsWith('--databases='))
    if (entry) return entry.split('=')[1]
  })()

  const location = path.join(databases, projectUUID)
  const db = levelup(leveldown(location))

  const propertiesStore = propertyPartition(db)
  const geometryStore = geometryPartition(db)
  const layerStore = new LayerStore(propertiesStore, geometryStore)
  const searchIndex = new SearchIndex(propertiesStore)

  searchIndex.on(':scope/index/updated', event => {
    console.log(searchIndex.search(`scope:${event.scope}`))
  })

  ipcRenderer.on('EDIT_UNDO', () => {
    // TODO: precondition: check document.activeElement
    if (undo.canUndo()) undo.undo()
  })

  ipcRenderer.on('EDIT_REDO', () => {
    // TODO: precondition: check document.activeElement
    if (undo.canRedo()) undo.redo()
  })

  const dragAndDrop = new DragAndDrop()

  dragAndDrop.on('layers', async ({ layers }) => {
    const command = await layerStore.commands.importLayers(layers)
    services.undo.apply(command)
  })

  const services = {}
  services.emitter = new EventEmitter()
  services.ipcRenderer = ipcRenderer
  services.master = levelup(new IPCDownClient(ipcRenderer))
  services.sessionStore = new SessionStore(services.master, `project:${projectUUID}`)
  services.undo = undo
  services.sources = new Sources(layerStore)

  // TODO: 57470315-1145-4730-9025-be56377062da - layer store: deselect (feature) removals

  services.selection = new Selection()
  services.dragAndDrop = dragAndDrop
  services.layerStore = layerStore
  services.searchIndex = searchIndex
  services.commandRegistry = new CommandRegistry(services)
  services.paletteCommands = new PaletteCommands(layerStore, undo)

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
    sidebar: false
  })

  const handleCommandPaletteBlur = () => setShowing({ ...showing, spotlight: false })
  const handleCommandPaletteKeyDown = ({ key }) => {
    if (key === 'Escape') setShowing({ ...showing, spotlight: false })
    if (key === 'Enter') setShowing({ ...showing, spotlight: false })
  }

  React.useEffect(() => {
    const handleCommand = event => {
      switch (event.type) {
        case 'open-command-palette': return setShowing({ ...showing, spotlight: true })
        case 'close-command-palette': return setShowing({ ...showing, spotlight: false })
        case 'toggle-sidebar': return setShowing({ ...showing, sidebar: !showing.sidebar })
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [showing])

  const spotlight = showing.spotlight &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
    />

  const sidebar = showing.sidebar && <div className="panel-left panel"/>

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
