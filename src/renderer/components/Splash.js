import uuid from 'uuid-random'
import { DateTime } from 'luxon'
import React from 'react'
import { Button, Input } from 'antd'
import { useServices } from './services'
import { ProjectList } from './project-list'


// NOTE: Might called multiple times for same message.
const reducer = (projectStore) => {
  const findProject = (projects, id) => Object.fromEntries(projects)[id]
  const snapshot = (_, { projects }) => projects

  const renameProject = (projects, { id, name }) => {
    const project = findProject(projects, id)
    if (project) projectStore.updateProject(id, { ...project, name })

    return projects.map(([_id, _project]) =>
      _id === id
        ? [id, { ..._project, name }]
        : [_id, _project]
    )
  }

  const createProject = (projects, { id }) => {
    if (findProject(projects, id)) return projects
    const project = { name: 'New Project', lastAccess: DateTime.local().toISO() }
    projectStore.createProject(id, project)
    return [[id, project], ...projects]
  }

  const deleteProject = (projects, { id }) => {
    if (!findProject(projects, id)) return projects
    projectStore.deleteProject(id)
    return projects.filter(([_id]) => _id !== id)
  }

  const handlers = {
    snapshot,
    renameProject,
    createProject,
    deleteProject
  }

  return (state, message) =>
    handlers[message.type]
      ? handlers[message.type](state, message)
      : state
}


export const Splash = () => {
  const { projectStore } = useServices()
  const { Search } = Input
  const [editing, setEditing] = React.useState(false)
  const [projects, dispatch] = React.useReducer(reducer(projectStore), [])

  React.useEffect(async () => {
    const projects = await projectStore.getProjects()
    dispatch({ type: 'snapshot', projects })
  }, [])

  const onSearch = () => console.log('search')
  const onEditStart = () => setEditing(true)
  const onEditDone = () => setEditing(false)
  const handleCreateProject = () => dispatch({ type: 'createProject', id: `project:${uuid()}` })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '8px'
      }}>
        <Search placeholder="Search project" onSearch={onSearch}/>
        <Button type='link' onClick={handleCreateProject}>New</Button>
        <Button type='link'>Import</Button>
        {
          editing
            ? <Button type='link' onClick={onEditDone}>Done</Button>
            : <Button type='link' onClick={onEditStart}>Edit</Button>
        }
      </div>
      <ProjectList
        projects={projects}
        editing={editing}
        dispatch={dispatch}
      />
    </div>
  )
}
