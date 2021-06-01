import uuid from 'uuid-random'
import { DateTime } from 'luxon'
import React from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from 'antd'
import { militaryFormat } from '../../shared/datetime'
import { useServices } from './services'

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
  const { project, editing, dispatch } = props
  const previewWidth = 320 * 0.75
  const previewHeight = 240 * 0.75
  const send = message => () => ipcRenderer.send(message, project.key)
  const [source, setSource] = React.useState(undefined)
  const { projectStore } = useServices()

  const fetch = () => projectStore.getPreview(project.key)

  React.useEffect(async () => {
    const source = await fetch()
    console.log('source', source)
    setSource(source)
  }, [])

  const handleTitleChange = value => {
    dispatch({ type: 'rename-project', key: project.key, value })
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
        <Button type='link' onClick={send('OPEN_PROJECT')}>Open</Button>
        <Button type='link' onClick={send('EXPORT_PROJECT')}>Export</Button>
        {
          editing
            ? <Button
                type='link'
                danger
                onClick={() => dispatch({ type: 'delete-project', key: project.key })}
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

    {/* <DeferredImage fetch={props.fetch(project.key)} {...dimensions}/> */}
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
    key={project.key}
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

const reducer = () => {
  const snapshot = (_, { projects }) => projects

  const renameProject = (projects, { key, value }) => {
    // TODO: call projectStore.renameProject()
    return projects.map(project => project.key === key
      ? { ...project, name: value }
      : project)
  }

  const createProject = state => {
    // TODO: call projectStore.createProject()
    return [{
      key: `project:${uuid()}`,
      name: 'New Project',
      lastAccess: DateTime.local().toISO()
    }, ...state]
  }

  const deleteProject = (projects, { key }) => {
    // TODO: call projectStore.deleteProject()
    return projects.filter(project => project.key !== key)
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
  const [projects, dispatch] = React.useReducer(reducer(), [])

  React.useEffect(async () => {
    const projects = await projectStore.getProjects()
    dispatch({ type: 'snapshot', projects })
  }, [])

  const onSearch = () => console.log('search')
  const onEditStart = () => setEditing(true)
  const onEditDone = () => setEditing(false)

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
        editing={editing}
        dispatch={dispatch}
      />
    </div>
  )
}
