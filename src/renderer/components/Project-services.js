import path from 'path'
import { ipcRenderer } from 'electron'
import * as L from '../../shared/level'
import EventEmitter from '../../shared/emitter'
import SessionStore from '../store/SessionStore'
import PreferencesStore from '../store/PreferencesStore'
import Store from '../store/Store'
import Schema from '../store/schema/Schema'
import ProjectStore from '../store/ProjectStore'
import SearchIndex from '../store/SearchIndex'
import DocumentStore from '../store/DocumentStore'
import OptionStore from '../store/OptionStore'
import Nominatim from '../store/Nominatim'
import { FeatureStore } from '../store/FeatureStore'
import { OSDDriver } from '../model/OSDDriver'
import { KBarActions } from '../model/actions/KBarActions'
import TileLayerStore from '../store/TileLayerStore'
import { CommandRegistry } from '../model/CommandRegistry'
import { CoordinatesFormat } from '../model/CoordinatesFormat'
import { DragAndDrop } from '../DragAndDrop'
import { Undo } from '../Undo'
import { Selection } from '../Selection'
import { Clipboard } from '../Clipboard'
import { bindings } from '../bindings'
import { SpatialIndex } from '../store/SpatialIndex'
import { MatrixClient } from '@syncpoint/matrix-client-api'

export default async projectUUID => {
  const services = {}
  const locator = () => services
  services.locator = locator

  const selection = new Selection()
  const undo = new Undo()

  const databases = (() => {
    const entry = process.argv.find(s => s.startsWith('--databases='))
    if (entry) return entry.split('=')[1]
  })()

  const emitter = new EventEmitter()

  const location = path.join(databases, projectUUID)
  const db = L.leveldb({ location })

  const jsonDB = L.jsonDB(db)
  const wkbDB = L.wkbDB(db)
  const preferencesDB = L.preferencesDB(db)
  const sessionDB = L.sessionDB(db)

  const store = new Store(jsonDB, wkbDB, undo, selection)

  // PUSH/PULL interface, replicates to main process
  const preferencesStore = new PreferencesStore(preferencesDB, ipcRenderer)
  const sessionStore = new SessionStore(sessionDB)
  const projectStore = new ProjectStore(ipcRenderer)
  const tileLayerStore = new TileLayerStore(store)
  const spatialIndex = new SpatialIndex(wkbDB)

  const documentStore = new DocumentStore(store)
  const osdDriver = new OSDDriver(projectUUID, emitter, preferencesStore, projectStore, store)
  const clipboard = new Clipboard(selection, store)
  const coordinatesFormat = new CoordinatesFormat(emitter, preferencesStore)
  const optionStore = new OptionStore(coordinatesFormat, store, sessionStore)
  const nominatim = new Nominatim(store)
  const featureStore = new FeatureStore(store, selection)
  const searchIndex = new SearchIndex(jsonDB, documentStore, optionStore, emitter, nominatim, sessionStore, spatialIndex)

  // Key bindings.
  bindings(clipboard, emitter)

  const inputTypes = [HTMLInputElement, HTMLTextAreaElement]
  const activeElement = () => document.activeElement
  const inputFocused = () => inputTypes.some(type => (activeElement() instanceof type))

  ipcRenderer.on('EDIT_UNDO', () => {
    if (inputFocused()) return ipcRenderer.send('DO_UNDO')
    if (undo.canUndo()) undo.undo()
  })

  ipcRenderer.on('EDIT_REDO', () => {
    if (inputFocused()) return ipcRenderer.send('DO_REDO')
    if (undo.canRedo()) undo.redo()
  })

  const dragAndDrop = new DragAndDrop(store)

  services.emitter = emitter
  services.ipcRenderer = ipcRenderer
  services.sessionStore = sessionStore
  services.undo = undo
  services.selection = selection
  services.dragAndDrop = dragAndDrop
  services.store = store
  services.preferencesStore = preferencesStore
  services.documentStore = documentStore
  services.searchIndex = searchIndex
  services.tileLayerStore = tileLayerStore
  services.featureStore = featureStore
  services.spatialIndex = spatialIndex
  services.osdDriver = osdDriver
  services.clipboard = clipboard
  services.coordinatesFormat = coordinatesFormat
  services.optionStore = optionStore
  services.searchIndex = searchIndex

  services.kbarActions = new KBarActions({
    store,
    emitter,
    selection,
    sessionStore
  })

  services.commandRegistry = new CommandRegistry(services)

  const schema = new Schema(db, {
    ids: 'KEY-ONLY',
    tags: 'SEPARATE',
    flags: 'SEPARATE',
    'default-tag': 'SEPARATE',
    styles: 'SEPARATE',
    ms2525c: 'LOADED', // NOTE: also deletes SKKM on UNLOADED.
    skkm: 'LOADED',
    'default-style': 'LOADED'
  })

  // Orderly bootstrapping:
  //
  await schema.bootstrap()
  await tileLayerStore.bootstrap()
  await searchIndex.bootstrap()
  await featureStore.bootstrap()
  await spatialIndex.bootstrap()

  const projectTags = (await projectStore.getProject(`project:${projectUUID}`)).tags || []
  const isRemoteProject = projectTags.includes('SHARED') || projectTags.includes('JOINED')

  services.replicationProvider = (isRemoteProject && process.env.MATRIX_HOME_SERVER_URL && process.env.MATRIX_USER_ID && process.env.MATRIX_PASSWORD
    ? MatrixClient({
      homeServerUrl: process.env.MATRIX_HOME_SERVER_URL,
      userId: process.env.MATRIX_USER_ID,
      password: process.env.MATRIX_PASSWORD,
      deviceId: projectUUID
    })
    : {
        disabled: true
      }
  )

  return services
}
