import * as R from 'ramda'
import { DateTime } from 'luxon'
import * as Window from './window'
import { evented, COMMAND, EVENT } from './evented'
import * as Master from './master'

const createProject = () => {
  // TODO: ...
}

const restoreProjectWindow = project => {
  const lastAccess = DateTime.now().toISO()
  Master.updateEntry(project.id, project => ({ ...project, open: true, lastAccess }))
  Window.projectWindow(project)
}

export const restore = async () => {
  const projects = await Master.projectList()

  // Restore open projects from last session (if any).
  const open = projects.filter(project => project.open)

  if (open.length > 0) open.forEach(restoreProjectWindow)
  else if (projects.length > 0) Window.projectWindow(R.head(projects))
  else {
    // TODO: create/open new project
  }
}

evented.on(COMMAND.CREATE_PROJECT, () => createProject())

evented.on(COMMAND.OPEN_PROJECT, async ({ id }) => {
  const win = Window.fromProjectId(id)
  if (win) win.focus()
  else {
    const lastAccess = DateTime.now().toISO()
    Master.updateEntry(id, project => ({ ...project, open: true, lastAccess }))
    const project = await Master.project(id)
    Window.projectWindow({ id, ...project })
    evented.emit(EVENT.PROJECT_OPENED, { id })
  }
})
