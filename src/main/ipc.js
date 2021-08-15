import path from 'path'
import { promises as fs } from 'fs'
import levelup from 'levelup'
import leveldown from 'leveldown'

export const ipc = (databases, ipcMain, projectStore) => {

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
    // Create and close projejct database:
    const uuid = project.id.split(':')[1]
    const location = path.join(databases, uuid)
    const db = levelup(leveldown(location))
    await db.close()

    return await projectStore.putProject(project)
  })

  ipcMain.handle('ipc:delete:project', async (_, id) => {
    // Delete project database:
    const uuid = id.split(':')[1]
    const location = path.join(databases, uuid)
    await fs.rmdir(location, { recursive: true })

    return projectStore.deleteProject(id)
  })
}
