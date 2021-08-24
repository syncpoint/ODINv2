import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'
import { ipcRenderer } from 'electron'
import { useServices, ServiceProvider } from './services'
import { initialState, singleselect } from './list-state'
import { SearchInput, List, reducer, Card } from '.'
import { militaryFormat } from '../../shared/datetime'
import { ProjectStore } from '../store'
import { Selection } from '../Selection'


/**
 *
 */
export const splash = () => {
  const services = {}
  services.ipcRenderer = ipcRenderer
  services.projectStore = new ProjectStore(ipcRenderer)
  services.selection = new Selection()

  return (
    <ServiceProvider { ...services }>
      <Splash/>
    </ServiceProvider>
  )
}


/**
 *
 */
const Title = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)
  const handleBlur = () => props.onChange(value)

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => event.stopPropagation()

  return <input
    className='card-title'
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />
}

Title.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

/**
 *
 */
const Media = props => {
  const { loadPreview } = props
  const scale = 0.5
  const width = `${320 * scale}px`
  const height = `${240 * scale}px`
  const [source, setSource] = React.useState(undefined)

  React.useEffect(() => {
    (async () => {
      const source = await loadPreview()
      setSource(source)
    })()
  }, [loadPreview])

  const placeholder = (text = null) => (
    <div className='placeholder' style={{ width, height }}>
      { text }
    </div>
  )

  return source === undefined
    ? placeholder()
    : source === null
      ? placeholder('Preview not available')
      : <img src={source} width={width} height={height}/>
}

Media.propTypes = {
  loadPreview: PropTypes.func.isRequired
}


/**
 *
 */
const CustomButton = props => (
  <Button
    danger={props.danger}
    onClick={props.onClick}
    disabled={props.disabled}
    style={{ ...props.style, background: 'inherit' }}
  >
    {props.text}
  </Button>
)

CustomButton.propTypes = {
  danger: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object,
  text: PropTypes.string.isRequired,
  disabled: PropTypes.bool
}


/**
 *
 */
const ButtonBar = props => (
  <div style={{
    display: 'flex',
    marginTop: 'auto',
    gap: '8px'
  }}>
    {props.children}
  </div>
)

ButtonBar.propTypes = {
  children: PropTypes.array.isRequired
}


/**
 *
 */
const Project = React.forwardRef((props, ref) => {
  // TODO: remove dependencies on ipc and store if possible
  const { ipcRenderer, projectStore } = useServices()
  const { project, selected } = props
  const send = message => () => ipcRenderer.send(message, project.id)
  const loadPreview = () => projectStore.getPreview(project.id)
  const handleRename = name => projectStore.updateProject({ ...project, name })
  const handleDelete = () => projectStore.deleteProject(project.id)

  const isOpen = props.project.tags
    ? props.project.tags.includes('OPEN')
    : false

  const className = props.focused
    ? 'card focus'
    : 'card'

  return (
    <div
      ref={ref}
      className={className}
      aria-selected={selected}
      onClick={event => props.onClick && props.onClick(event)}
      onDoubleClick={event => props.onDoubleClick && props.onDoubleClick(event)}
    >
      <div className='card-content'>
        <Title value={project.name} onChange={handleRename}/>
        <span className='card-text'>{militaryFormat.fromISO(project.lastAccess)}</span>

        <ButtonBar>
          <CustomButton onClick={send('OPEN_PROJECT')} text='Open'/>
          <CustomButton onClick={send('EXPORT_PROJECT')} text='Export'/>
          <CustomButton
            danger
            onClick={handleDelete}
            style={{ marginLeft: 'auto' }}
            text='Delete'
            disabled={isOpen}
          />
        </ButtonBar>
      </div>
      <Media loadPreview={loadPreview}/>
    </div>
  )
})

Project.propTypes = {
  project: PropTypes.object.isRequired,
  focused: PropTypes.bool,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func
}


/**
 *
 */
export const Splash = () => {
  const { projectStore, ipcRenderer } = useServices()
  const [filter, setFilter] = React.useState('')
  const [state, dispatch] = React.useReducer(reducer(singleselect), initialState)

  /**
   * Reload projects from store and update entry list
   * with optional entry id to focus.
   * Use current filter to load only projects to display in list.
   *
   * @param {*} projectId - optional project id to focus in list next.
   */
  const fetch = React.useCallback(projectId => {
    console.log('[fetch]', projectId)
    ;(async () => {
      const projects = await projectStore.getProjects(filter)
      dispatch({ type: 'entries', entries: projects, candidateId: projectId })
      if (projectId) dispatch({ type: 'focus', focusId: projectId })
    })()
  }, [filter, projectStore])


  /**
   * Listen to store events.
   * Reload/updates projects as appropriate.
   */
  React.useEffect(() => {
    const updated = async ({ project }) => fetch(project.id)
    const created = async ({ project }) => fetch(project.id)
    const deleted = async () => fetch()

    const handlers = { updated, created, deleted }
    Object.entries(handlers).forEach(([event, handler]) => projectStore.on(event, handler))

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => projectStore.off(event, handler))
    }
  }, [projectStore, fetch])


  /**
   * Listen on project/window close event.
   * Updates projects as appropriate.
   */
  React.useEffect(() => {
    const channel = 'ipc:post:project/closed'
    const handleClosed = () => fetch()
    ipcRenderer.on(channel, handleClosed)
    return () => ipcRenderer.off(channel, handleClosed)
  }, [ipcRenderer, fetch])


  /**
   * Reload projects whenever search filter changes.
   */
  React.useEffect(fetch, [fetch])

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleSearch = value => setFilter(value.toLowerCase())
  const handleCreate = () => projectStore.createProject()
  const handleClick = id => ({ metaKey, shiftKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey })
  }

  /* eslint-disable react/prop-types */
  const child = props => {
    const { entry: project } = props
    const send = message => () => ipcRenderer.send(message, project.id)
    const loadPreview = () => projectStore.getPreview(project.id)
    const handleRename = name => projectStore.updateProject({ ...project, name })
    const handleDelete = () => projectStore.deleteProject(project.id)

    const isOpen = project.tags
      ? project.tags.includes('OPEN')
      : false

    return (
      <Card
        key={props.id}
        ref={props.ref}
        onClick={handleClick(props.id)}
        focused={props.focused}
        selected={props.selected}
      >
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div className='card-content'>
            <Title value={project.name} onChange={handleRename}/>
            <span className='card-text'>{militaryFormat.fromISO(project.lastAccess)}</span>

            <ButtonBar>
              <CustomButton onClick={send('OPEN_PROJECT')} text='Open'/>
              <CustomButton onClick={send('EXPORT_PROJECT')} text='Export'/>
              <CustomButton
                danger
                onClick={handleDelete}
                style={{ marginLeft: 'auto' }}
                text='Delete'
                disabled={isOpen}
              />
            </ButtonBar>
          </div>
          <Media loadPreview={loadPreview}/>
        </div>
      </Card>
    )
  }
  /* eslint-enable react/prop-types */


  const ref = React.useRef()

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      <div
        style={{ display: 'flex', gap: '8px', padding: '8px' }}
      >
        <SearchInput onSearch={handleSearch}/>
        <Button onClick={handleCreate}>New</Button>
        <Button>Import</Button>
      </div>
      <div className='list-container'>
        <List
          ref={ref}
          child={child}
          { ...state }
        />
      </div>
    </div>
  )
}
