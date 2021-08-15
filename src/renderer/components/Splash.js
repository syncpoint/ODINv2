import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'
import { useServices } from './services'
import { List, useListStore } from './List'
import { singleselect } from './singleselect'
import { Search } from './Search'
import { militaryFormat } from '../../shared/datetime'


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
    className='cardtitle'
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
  const scale = 0.5
  const width = `${320 * scale}px`
  const height = `${240 * scale}px`
  const [source, setSource] = React.useState(undefined)

  React.useEffect(async () => {
    const source = await props.loadPreview()
    setSource(source)
  }, [])

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
    ? 'project card-container focus'
    : 'project card-container'

  return (
    <div
      ref={ref}
      className={className}
      tabIndex={0}
      aria-selected={selected}
    >
      <div className='cardcontent'>
        <Title value={project.name} onChange={handleRename}/>
        <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

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
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired
}


/**
 *
 */
export const Splash = () => {
  const { projectStore, ipcRenderer } = useServices()
  const ref = React.useRef()

  const { state, dispatch, fetch } = useListStore({
    strategy: singleselect,
    fetch: filter => projectStore.getProjects(filter)
  })

  React.useEffect(() => {
    const updated = ({ id, project }) => fetch()
    const created = ({ id, project }) => fetch(id)
    const deleted = ({ id }) => fetch()

    const handlers = { updated, created, deleted }
    Object.entries(handlers).forEach(([event, handler]) => projectStore.on(event, handler))

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => projectStore.off(event, handler))
    }
  }, [dispatch])

  React.useEffect(() => {
    const channel = 'ipc:post:project/closed'
    const handleClosed = () => fetch()
    ipcRenderer.on(channel, handleClosed)
    return () => ipcRenderer.off(channel, handleClosed)
  }, [])

  const handleCreate = () => projectStore.createProject()
  const handleSearch = value => dispatch({ path: 'filter', filter: value.toLowerCase() })
  const handleFocusList = () => ref.current.focus()
  const handleOpen = project => console.log('onOpen', project)
  const handleBack = project => console.log('onBack', project)
  const handleEnter = project => console.log('onEnter', project)

  const handleFocus = id => console.log('onFocus', id)
  const handleSelect = id => console.log('onSelect', id)

  /* eslint-disable react/prop-types */
  const renderEntry = props => <Project
    key={props.entry.id}
    ref={props.ref}
    role='option'
    project={props.entry}
    onClick={props.handleClick}
    { ...props }
  />
  /* eslint-enable react/prop-types */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      <div
        style={{ display: 'flex', gap: '8px', padding: '8px' }}
      >
        <Search onSearch={handleSearch} onFocusList={handleFocusList}/>
        <Button onClick={handleCreate}>New</Button>
        <Button>Import</Button>
      </div>
      <List
        ref={ref}
        multiselect={false}
        renderEntry={renderEntry}
        onOpen={handleOpen}
        onBack={handleBack}
        onEnter={handleEnter}
        onFocus={handleFocus}
        onSelect={handleSelect}
        dispatch={dispatch}
        { ...state }
      />
    </div>
  )
}
