import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import { propertiesPartition, geometryPartition, preferencesPartition } from '../../shared/level'
import EventEmitter from '../../shared/emitter'
import { SessionStore, Store, SearchIndex, PreferencesStore } from '../store'
import { Sources, PaletteCommands } from '../model'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { bindings } from '../commands/bindings'

export default projectUUID => {
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

  return services
}
