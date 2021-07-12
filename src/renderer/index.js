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

process.traceProcessWarnings = true

// Clipboard events: Handlers must evaluate target element to determin context.
document.addEventListener('copy', event => console.log('[index] copy', event))
document.addEventListener('cut', event => console.log('[index] cut', event))
document.addEventListener('paste', event => console.log('[index] paste', event))
ipcRenderer.on('EDIT_UNDO', () => console.log('IPC:EDIT_UNDO', document.activeElement))
ipcRenderer.on('EDIT_REDO', () => console.log('IPC:EDIT_REDO', document.activeElement))

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
  const services = {}
  services.ipcRenderer = ipcRenderer
  services.master = levelup(new IPCDownClient(ipcRenderer))
  services.sessionStore = new SessionStore(services.master, page)

  const project = page.split(':')[1]
  const location = path.join(databases, project)
  const db = levelup(leveldown(location))
  const layerStore = new LayerStore(db)
  services.sources = new Sources(layerStore)
  services.selection = new Selection()

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
