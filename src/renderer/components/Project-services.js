import path from 'path'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import * as L from '../../shared/level'
import EventEmitter from '../../shared/emitter'
import { SessionStore, SearchIndex, PreferencesStore, Store, MigrationTool, ProjectStore } from '../store'
import { PaletteCommands, ViewMemento, Controller, OSDDriver } from '../model'
import { CoordinatesFormat } from '../model/CoordinatesFormat'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { Clipboard } from '../Clipboard'
import { bindings } from '../bindings'

export default async projectUUID => {
  const selection = new Selection()
  const undo = new Undo()

  const databases = (() => {
    const entry = process.argv.find(s => s.startsWith('--databases='))
    if (entry) return entry.split('=')[1]
  })()

  const master = L.leveldb({ down: new IPCDownClient(ipcRenderer) })
  const sessionStore = new SessionStore(master, `project:${projectUUID}`)
  const viewMemento = new ViewMemento(sessionStore)
  const emitter = new EventEmitter()

  const location = path.join(databases, projectUUID)
  const db = L.leveldb({ location })

  const migrationsOptions = {}
  migrationsOptions[MigrationTool.REDUNDANT_IDENTIFIERS] = false
  migrationsOptions[MigrationTool.INLINE_TAGS] = false
  migrationsOptions[MigrationTool.INLINE_FLAGS] = false
  migrationsOptions[MigrationTool.DEFAULT_TAG] = false
  const migration = new MigrationTool(db, migrationsOptions)
  await migration.upgrade()


  const jsonDB = L.jsonDB(db)
  const wbkDB = L.wbkDB(db)
  const preferencesDB = L.preferencesDB(db)

  const store = new Store(jsonDB, wbkDB, undo, selection)
  const preferencesStore = new PreferencesStore(preferencesDB, ipcRenderer)
  const projectStore = new ProjectStore(ipcRenderer)

  const searchIndex = new SearchIndex(jsonDB)
  const controller = new Controller(store, emitter, ipcRenderer, selection)
  const osdDriver = new OSDDriver(projectUUID, emitter, preferencesStore, projectStore, store)
  const clipboard = new Clipboard(selection, store)
  const coordinatesFormat = new CoordinatesFormat(emitter, preferencesStore)

  // Key bindings.
  bindings(emitter, clipboard)

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

  const dragAndDrop = new DragAndDrop(store)

  const services = {}
  services.emitter = emitter
  services.ipcRenderer = ipcRenderer
  services.master = master
  services.sessionStore = sessionStore
  services.viewMemento = viewMemento
  services.undo = undo
  services.selection = selection
  services.dragAndDrop = dragAndDrop
  services.store = store
  services.preferencesStore = preferencesStore
  services.searchIndex = searchIndex
  services.controller = controller
  services.osdDriver = osdDriver
  services.clipboard = clipboard
  services.coordinatesFormat = coordinatesFormat

  services.paletteCommands = new PaletteCommands({
    store,
    emitter,
    selection
  })

  return services
}
