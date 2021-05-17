import path from 'path'
import React from 'react'
import ReactDOM from 'react-dom'
import { ipcRenderer } from 'electron'
import levelup from 'levelup'
import leveldown from 'leveldown'

import * as Registry from './registry'
import { Session } from './store/Session'
import { IPCDownClient } from '../shared/level/ipc'
import './index.css'
import { Project } from './components/Project'
import { Splash } from './components/Splash'
import EventEmitter from '../shared/emitter'

Registry.put(Registry.EVENTED, new EventEmitter())
Registry.put(Registry.MASTER, levelup(new IPCDownClient(ipcRenderer)))

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()

const databases = (() => {
  const entry = process.argv.find(s => s.startsWith('--databases='))
  if (entry) return entry.split('=')[1]
})()

if (page.startsWith('project:')) {
  // Setup project database and serve through IPC.
  const project = page.split(':')[1]
  const location = path.join(databases, project)
  const db = levelup(leveldown(location))
  Registry.put(Registry.DB, db)

  // Setup session store (project metadata in main/master).
  const master = Registry.get(Registry.MASTER)
  const session = new Session(master, page)
  Registry.put(Registry.SESSION, session)
}

const app = page === 'splash'
  ? <Splash/>
  : <Project/>

const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(app, container)
