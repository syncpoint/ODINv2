import React from 'react'
import { Button } from 'antd'
import { useServices } from './services'
import { List } from './list/List'
import { multiselect } from './list/multiselect'
import { Search } from './Search'
import { Project } from './project/Project'
import { indexOf } from './list/selection'

/**
 *
 */
const useListStore = options => {
  const [state, setState] = React.useState({
    /** entries :: [[id, entry]] */
    entries: [],

    /** focusId :: id || null */
    focusId: null,

    focusIndex: -1,

    /** selected :: [id] */
    selected: [],
    scroll: 'smooth',
    filter: null
  })

  const fetch = async focusId => {
    const entries = await options.fetch(state.filter)
    if (focusId) {
      const focusIndex = indexOf(entries, focusId)
      setState({ ...state, entries, focusId, focusIndex, scroll: 'smooth' })
    } else {
      const focusIndex = Math.min(entries.length - 1, state.focusIndex)
      const focusId = focusIndex !== -1
        ? entries[focusIndex][0]
        : null
      setState({ ...state, entries, focusId, focusIndex, scroll: 'smooth' })
    }
  }

  React.useEffect(() => fetch(), [state.filter])

  const dispatch = event => {
    const handler = options.strategy[event.path]
    if (handler) setState(handler(state, event))
  }

  return { state, dispatch, fetch }
}


/**
 *
 */
export const Splash = () => {
  const { projectStore, ipcRenderer } = useServices()
  const ref = React.useRef()

  const { state, dispatch, fetch } = useListStore({
    strategy: multiselect,
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
  const handleOpen = id => console.log('onOpen', id)
  const handleBack = id => console.log('onBack', id)
  const handleFocus = id => console.log('onFocus', id)
  const handleSelect = id => console.log('onSelect', id)

  const renderEntry = ([id, project], props) => <Project
    id={id}
    project={project}
    { ...props }
  />

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
        multiselect={true}
        renderEntry={renderEntry}
        onOpen={handleOpen}
        onBack={handleBack}
        onFocus={handleFocus}
        onSelect={handleSelect}
        dispatch={dispatch}
        { ...state }
      />
    </div>
  )
}
