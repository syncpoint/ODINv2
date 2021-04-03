import path from 'path'
import { ipcRenderer } from 'electron'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { QUERY } from '../../shared/ipc'
import { evented, EVENT } from '../evented'

let db

;(async () => {
  const { projectId, userData } = await ipcRenderer.invoke(QUERY.PROJECT_CONFIGURATION)
  const databases = path.join(userData, 'databases')
  const directory = path.join(databases, projectId.split(':')[1])

  db = levelup(leveldown(directory))
  evented.emit(EVENT.STORE_READY)
})()

export default () => db
