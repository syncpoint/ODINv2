import uuid from 'uuid-random'
import { DateTime } from 'luxon'
import React from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from 'antd'
import { militaryFormat } from '../../shared/datetime'
import { useServices } from './services'

const Card = props =>
  <div className='card'>
    { props.children }
  </div>

Card.propTypes = {
  children: PropTypes.array
}

const CardContent = props =>
  <div className='cardcontent'>
    { props.children }
  </div>

CardContent.propTypes = {
  children: PropTypes.array
}

// TODO: support 'Escape' key to revert edit and focus parent
const TitleInput = props => {
  const { editing } = props
  const [value, setValue] = React.useState(props.value)

  const handleChange = event => {
    setValue(event.target.value)
  }

  const handleBlur = () => {
    if (editing) props.onChange(value)
  }

  return <input
    className='cardtitle'
    type={editing ? 'search' : 'submit'}
    disabled={!editing} /* prevent focus when not editable */
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
  />
}

TitleInput.propTypes = {
  value: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
}

const Project = props => {
  const { ipcRenderer } = useServices()
  const { id, project, editing, dispatch } = props
  const previewWidth = 320 * 0.75
  const previewHeight = 240 * 0.75
  const send = message => () => ipcRenderer.send(message, id)
  const [source, setSource] = React.useState(undefined)
  const { projectStore } = useServices()

  const fetch = () => projectStore.getPreview(id)

  React.useEffect(async () => {
    const source = await fetch()
    setSource(source)
  }, [])

  const handleTitleChange = name => {
    dispatch({ type: 'rename-project', id, name })
  }

  const preview = (text = null) => (
    <div className='preview' style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}>
      { text }
    </div>
  )

  return <Card>
    <CardContent>
      <TitleInput value={project.name} onChange={handleTitleChange} editing={editing}/>
      <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

      <div style={{
        display: 'flex',
        marginTop: 'auto'
      }}>
        <Button type='link' disabled={editing} onClick={send('OPEN_PROJECT')}>Open</Button>
        <Button type='link' disabled={editing} onClick={send('EXPORT_PROJECT')}>Export</Button>
        {
          editing
            ? <Button
                type='link'
                danger
                onClick={() => dispatch({ type: 'delete-project', id })}
                style={{ marginLeft: 'auto' }}
              >Delete</Button>
            : null
        }
      </div>
    </CardContent>

    {
      source === undefined
        ? preview()
        : source !== null
          ? <img src={source} width={`${previewWidth}px`} height={`${previewHeight}px`}/>
          : preview('Preview not available')
    }
  </Card>
}

Project.propTypes = {
  id: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}

const ProjectList = props => {
  const project = ([id, project]) => <Project
    key={id}
    id={id}
    project={project}
    editing={props.editing}
    dispatch={props.dispatch}
  />

  return <div role='listbox' className="projectlist">
    { props.projects.map(project)}
  </div>
}

ProjectList.propTypes = {
  projects: PropTypes.array.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}

// FIXME: passing project store possibly makes reducer impure, i.e. messages are dispatched more than once
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
    'rename-project': renameProject,
    'create-project': createProject,
    'delete-project': deleteProject
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
  const handleCreate = () => {
    dispatch({ type: 'create-project', id: `project:${uuid()}` })
  }

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
        <Button type='link' onClick={handleCreate}>New</Button>
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
