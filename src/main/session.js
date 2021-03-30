import path from 'path'
import * as R from 'ramda'
import { app, BrowserWindow } from 'electron'
import * as Master from './master'
import * as L from '../shared/level'
import * as Window from './window'
import { evented, COMMAND } from './evented'

const byLastAccess = (a, b) => b.lastAccess.localeCompare(a.lastAccess)

const notCold = process.argv.indexOf('--cold') === -1
const hot = process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath)

const mainURL = (hot && notCold)
  ? new URL('index.html', 'http://localhost:8080')
  : new URL(path.join(app.getAppPath(), 'dist', 'index.html'), 'file:')


const openProject = async project => {
  const master = Master.database()

  const options = {
    url: mainURL,
    title: project.name,
    x: project.x,
    y: project.y,
    width: project.width,
    height: project.height
  }

  const window = Window.create(options)
  window.projectId = project.id

  ;['resized', 'moved'].forEach(event => window.on(event, () => {
    L.update(master, `project:${project.id}`, project => ({
      ...project,
      ...window.getBounds()
    }))
  }))
}

const createProject = () => {
  console.log('createProject')
  const windows = BrowserWindow.getAllWindows()
  console.log('[createProject]', windows)
}

const fetchProjects = async () => {
  const master = Master.database()
  const projects = await L.aggregate(master, 'project:')

  return Object.entries(projects).reduce((acc, [id, project]) => {
    return acc.concat({ id, ...project })
  }, [])
}


export const restore = async () => {
  const projects = await fetchProjects()
  projects.sort(byLastAccess)

  R.cond([
    [projects => projects.length > 0, projects => openProject(R.head(projects))],
    [R.T, createProject]
  ])(projects)
}


evented.on(COMMAND.CREATE_PROJECT, () => createProject())
