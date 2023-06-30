import { app } from 'electron'
import path from 'path'
import * as L from '../shared/level'
import * as paths from './paths'

const projectUUID = project => project.id.split(':')[1]

export const Collaboration = function ({ sessionStore, projectStore, windowManager }) {
  this.sessionStore = sessionStore
  this.projectStore = projectStore
  this.windowManager = windowManager
}

Collaboration.prototype.login = async function () {
  const id = 'login'
  if (this.windowManager.isWindowOpen(id)) {
    return this.windowManager.focusWindow(id)
  } else {
    const window = await this.windowManager.showLogin()
    window.show()
  }
}

Collaboration.prototype.logout = async function () {
  const id = 'logout'
  if (this.windowManager.isWindowOpen(id)) {
    return this.windowManager.focusWindow(id)
  } else {
    const window = await this.windowManager.showLogout()
    window.show()
  }
}

Collaboration.prototype.purgeSettings = async function () {

  const delay = timeout => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, timeout)
    })
  }


  const projects = await this.projectStore.getProjects()
  const sharedProjects = projects.filter(project => project.tags.includes('SHARED'))

  const removeSharedLayers = () => sharedProjects.map(async (project) => {
    try {
      const location = path.join(paths.databases(app), projectUUID(project))
      console.log(`Purging collaboration settings from ${project.id} located at ${location}`)
      const db = L.leveldb({ location })

      const jsonDB = L.jsonDB(db)
      const sharedLayers = await L.keys(jsonDB, 'shared+')
      await L.mdel(jsonDB, sharedLayers)
      console.log('Removed shared layers')
      const session = L.sessionDB(db)

      await L.mdel(session, ['replication:seed', 'replication:credentials', 'replication:streamToken'])
      console.log('Removed seed, credentials and streamToken')
      if (db.status === 'open') {
        await db.close()
      }
    } catch (error) {
      console.error(error)
    }
  })

  await Promise.all(sharedProjects.map(project => this.windowManager.closeWindow(project.id)))
  console.log('All shared project windows are closed now ...')

  await Promise.all(sharedProjects.map(project => this.projectStore.removeTag(project.id, 'SHARED')))

  await this.projectStore.delCredentials('PROJECT-LIST')
  await this.projectStore.delCredentials('default')

  /*
    We need to make sure all project dbs are closed. As of jun23 I'm not aware
    of a programatic way to determine the state of the leveldb resources.
    This is where delay comes in :-(
  */
  await delay(2000)
  await Promise.all(removeSharedLayers())

  console.log(`Purged collaboration settings from ${sharedProjects.length} shared projects.`)
}

