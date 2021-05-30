import { ipcRenderer } from 'electron'
import uuid from 'uuid-random'
import { DateTime } from 'luxon'
import React from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from 'antd'
import * as Registry from '../registry'
import Store from '../../shared/level/Store'
import { militaryFormat } from '../../shared/datetime'

const DeferredImage = props => {
  const [source, setSource] = React.useState(undefined)
  const scale = props.scale || 1
  const width = props.width * scale
  const height = props.height * scale

  React.useEffect(async () => {
    const source = await props.fetch()
    setSource(source)
  }, [])

  return <img
    src={source}
    width={width}
    height={height}
  />
}

DeferredImage.propTypes = {
  scale: PropTypes.number,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  fetch: PropTypes.func.isRequired
}

const Card = props => {
  return <div
    className='card'
  >
    { props.children }
  </div>
}

Card.propTypes = {
  children: PropTypes.array
}

const CardContent = props => {
  return <div className='cardcontent'>
    { props.children }
  </div>
}

CardContent.propTypes = {
  children: PropTypes.array
}

// FIXME: should not depend on `dispatch` or `id`
// TODO: support 'Escape' key to revert edit and focus parent
const TitleInput = props => {
  const { id, dispatch, editing } = props
  const [value, setValue] = React.useState(props.value)

  const handleChange = event => {
    setValue(event.target.value)
  }

  const handleBlur = () => {
    if (editing) dispatch({ type: 'rename-project', id, value })
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
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}

const Project = props => {
  const { project, editing, dispatch } = props
  const dimensions = { width: 320, height: 240, scale: 0.75 }
  const send = message => () => ipcRenderer.send(message, project.id)

  return <Card>
    <CardContent>
      <TitleInput id={project.id} value={project.name} dispatch={props.dispatch} editing={editing}/>
      <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

      <div style={{
        display: 'flex',
        marginTop: 'auto'
      }}>
        <Button type='link' onClick={send('OPEN_PROJECT')}>Open</Button>
        <Button type='link' onClick={send('EXPORT_PROJECT')}>Export</Button>
        {
          editing
            ? <Button
                type='link'
                danger
                onClick={() => dispatch({ type: 'delete-project', id: project.id })}
                style={{ marginLeft: 'auto' }}
              >Delete</Button>
            : null
        }
      </div>
    </CardContent>
    <DeferredImage fetch={props.fetch(project.id)} {...dimensions}/>
  </Card>
}

Project.propTypes = {
  project: PropTypes.object.isRequired,
  fetch: PropTypes.func.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}

const ProjectList = props => {
  const project = project => <Project
    key={project.id}
    project={project}
    fetch={props.fetch}
    editing={props.editing}
    dispatch={props.dispatch}
  />

  return <div role='listbox' className="projectlist">
    { props.projects.map(project)}
  </div>
}

ProjectList.propTypes = {
  projects: PropTypes.array.isRequired,
  fetch: PropTypes.func.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}

const reducer = () => {
  const snapshot = (_, { projects }) => projects

  const renameProject = (projects, { id, value }) => {
    return projects.map(project => project.id === id
      ? { ...project, name: value }
      : project)
  }

  const createProject = state => {
    return [{
      id: `project:${uuid()}`,
      name: 'New Project',
      lastAccess: DateTime.local().toISO()
    }, ...state]
  }

  const deleteProject = (projects, { id }) => {
    return projects.filter(project => project.id !== id)
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
  const { Search } = Input
  const master = Registry.get(Registry.MASTER)
  const store = new Store(master)
  const [editing, setEditing] = React.useState(false)
  const [projects, dispatch] = React.useReducer(reducer(), [])

  React.useEffect(async () => {
    const projects = await new Promise((resolve, reject) => {
      const acc = []
      master.createReadStream({ keys: true, values: true, gte: 'project:', lte: 'project:\xff' })
        .on('data', ({ key, value }) => acc.push({ id: key, ...value }))
        .on('error', err => reject(err))
        .on('end', () => resolve(acc))
    })

    dispatch({ type: 'snapshot', projects })
  }, [])

  const fetch = key => () => store.get(`preview:${key}`, null)
  const onSearch = () => console.log('search')

  const onEditStart = () => setEditing(true)
  const onEditDone = () => setEditing(false)

  return <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}
  >
    <div style={{
      display: 'flex',
      gap: '0',
      padding: '8px'
    }}>
      <Search placeholder="Search project" onSearch={onSearch}/>
      <Button type='link' onClick={() => dispatch({ type: 'create-project' })}>New</Button>
      <Button type='link'>Import</Button>
      {
        editing
          ? <Button type='link' onClick={onEditDone}>Done</Button>
          : <Button type='link' onClick={onEditStart}>Edit</Button>
      }
    </div>
    <ProjectList
      projects={projects}
      fetch={fetch}
      editing={editing}
      dispatch={dispatch}
    />
  </div>

}
