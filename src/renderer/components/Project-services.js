import path from 'path'
import { ipcRenderer } from 'electron'
import { IPCDownClient } from '../../shared/level/ipc'
import { leveldb, propertiesPartition, geometriesPartition, preferencesPartition } from '../../shared/level'
import EventEmitter from '../../shared/emitter'
import { SessionStore, Store, SearchIndex, PreferencesStore } from '../store'
import { Sources, PaletteCommands, Highlight, ViewMemento, Controller } from '../model'
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

  const master = leveldb({ down: new IPCDownClient(ipcRenderer) })
  const sessionStore = new SessionStore(master, `project:${projectUUID}`)
  const viewMemento = new ViewMemento(sessionStore)
  const emitter = new EventEmitter()
  const location = path.join(databases, projectUUID)
  const db = leveldb({ location })
  const propertiesLevel = propertiesPartition(db)
  const geometryLevel = geometriesPartition(db)
  const preferencesLevel = preferencesPartition(db)
  const store = new Store(propertiesLevel, geometryLevel, undo, selection)
  const highlight = new Highlight(store, selection, emitter, viewMemento)
  const preferencesStore = new PreferencesStore(preferencesLevel)
  const searchIndex = new SearchIndex(propertiesLevel)
  const controller =  new Controller(store, emitter)

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

  dragAndDrop.on('layers', ({ layers }) => {
    const values = layers.reduce((acc, layer) => {
      const features = layer.features
      delete layer.features
      delete layer.type
      acc.push(layer)

      return features.reduce((acc, feature) => {
        if (feature.properties) delete feature.properties.layerId
        acc.push(feature)
        return acc
      }, acc)
    }, [])

    store.insert(values)
  })

  const services = {}
  services.emitter = emitter
  services.ipcRenderer = ipcRenderer
  services.master = master
  services.sessionStore = sessionStore
  services.viewMemento = viewMemento
  services.undo = undo
  services.sources = new Sources(store, selection, highlight)
  services.selection = selection
  services.dragAndDrop = dragAndDrop
  services.store = store
  services.preferencesStore = preferencesStore
  services.searchIndex = searchIndex
  services.paletteCommands = new PaletteCommands(store, emitter)
  services.highlight = highlight
  services.controller = controller

  return services
}
