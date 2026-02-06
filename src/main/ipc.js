import path from 'path'
import { promises as fs } from 'fs'
import { app } from 'electron'
import { leveldb, sessionDB } from '../shared/level'
import { initPaths } from './paths'

const paths = initPaths(app)

export const ipc = (ipcMain, projectStore) => {

  ipcMain.handle('ipc:get:project', (_, id) => {
    return projectStore.getProject(id)
  })

  ipcMain.handle('ipc:get:projects', () => {
    return projectStore.getProjects()
  })

  ipcMain.handle('ipc:get:project/preview', (_, id) => {
    return projectStore.getPreview(id)
  })

  ipcMain.handle('ipc:put:project', (_, project) => {
    return projectStore.putProject(project)
  })

  ipcMain.handle('ipc:post:project', async (_, project) => {
    // Create and close project database:
    const uuid = project.id.split(':')[1]
    const location = path.join(paths.databases, uuid)
    const db = leveldb({ location })
    await db.close()

    return await projectStore.putProject(project)
  })

  ipcMain.handle('ipc:delete:project', async (_, id) => {
    // Delete project database:
    const uuid = id.split(':')[1]
    const location = path.join(paths.databases, uuid)
    await fs.rm(location, { recursive: true })

    return projectStore.deleteProject(id)
  })

  ipcMain.handle('ipc:add:project/tag', (_, id, tag) => {
    return projectStore.addTag(id, tag)
  })

  ipcMain.handle('ipc:remove:project/tag', (_, id, tag) => {
    return projectStore.removeTag(id, tag)
  })

  ipcMain.handle('ipc:get:replication/streamToken', async (_, id) => {
    return projectStore.getStreamToken(id)
  })

  ipcMain.handle('ipc:put:replication/streamToken', async (_, id, streamToken) => {
    return projectStore.putStreamToken(id, streamToken)
  })

  ipcMain.handle('ipc:get:replication/credentials', async (_, id) => {
    return projectStore.getCredentials(id)
  })

  ipcMain.handle('ipc:put:replication/credentials', async (_, id, credentials) => {
    return projectStore.putCredentials(id, credentials)
  })

  ipcMain.handle('ipc:del:replication/credentials', async (_, id) => {
    return projectStore.delCredentials(id)
  })

  ipcMain.handle('ipc:put:project:replication/seed', async (_, id, seed) => {
    try {
      const uuid = id.split(':')[1]
      const location = path.join(paths.databases, uuid)
      const db = leveldb({ location })
      const session = sessionDB(db)
      await session.put('replication:seed', seed)
      await db.close()
    } catch (error) {
      console.error(error)
    }
  })
}
