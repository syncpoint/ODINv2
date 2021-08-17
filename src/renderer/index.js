import path from 'path'
import React from 'react'
import ReactDOM from 'react-dom'
import { ipcRenderer } from 'electron'
import levelup from 'levelup'
import leveldown from 'leveldown'
import 'antd/dist/antd.css'
import { SessionStore } from './store/SessionStore'
import { ProjectStore } from './store/ProjectStore'
import { IPCDownClient } from '../shared/level/ipc'
import './index.css'
import { Project } from './components/Project'
import { Splash } from './components/Splash'
import { ServiceProvider } from './components/services'
import { Selection } from './Selection'
import { LayerStore } from './store/LayerStore'
import { Sources } from './model/Sources'
import { DragAndDrop } from './DragAndDrop'
import { Undo } from './Undo'
import { CommandRegistry } from './commands/CommandRegistry'
import EventEmitter from '../shared/emitter'
import { PaletteCommands } from './model/PaletteCommands'

process.traceProcessWarnings = true

// Clipboard events: Handlers must evaluate target element to determin context.
document.addEventListener('copy', event => console.log('[index] copy', event))
document.addEventListener('cut', event => console.log('[index] cut', event))
document.addEventListener('paste', event => console.log('[index] paste', event))

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()

const databases = (() => {
  const entry = process.argv.find(s => s.startsWith('--databases='))
  if (entry) return entry.split('=')[1]
})()


/**
 *
 */
const project = () => {
  const undo = new Undo()
  const project = page.split(':')[1]
  const location = path.join(databases, project)
  const db = levelup(leveldown(location))
  const layerStore = new LayerStore(db)

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
  services.sessionStore = new SessionStore(services.master, page)
  services.undo = undo
  services.sources = new Sources(layerStore)

  // TODO: 57470315-1145-4730-9025-be56377062da - layer store: deselect (feature) removals

  services.selection = new Selection()
  services.dragAndDrop = dragAndDrop
  services.layerStore = layerStore
  services.commandRegistry = new CommandRegistry(services)
  services.paletteCommands = new PaletteCommands(layerStore, undo)

  return (
    <ServiceProvider { ...services }>
      <Project/>
    </ServiceProvider>
  )
}


/**
 *
 */
const splash = () => {
  const services = {}
  services.ipcRenderer = ipcRenderer
  services.projectStore = new ProjectStore(ipcRenderer)
  services.selection = new Selection()

  return (
    <ServiceProvider { ...services }>
      <Splash/>
    </ServiceProvider>
  )
}

const app = page === 'splash'
  ? splash()
  : project()

const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(app, container)
