import React from 'react'
import { Button } from 'antd'
import { useServices } from './services'
import { List } from './List'
import { Search } from './Search'
import { Project } from './project/Project'

export const Splash = () => {
  const { projectStore } = useServices()
  const [projects, setProjects] = React.useState([])
  const [filter, setFilter] = React.useState([])
  const ref = React.useRef()

  const onUpdated = ({ projects }) => {
    const sorted = projects.filter(([_, project]) => !projectStore.includesTag(project, 'deleted'))
    sorted.sort((a, b) => a[1].name.localeCompare(b[1].name))
    setProjects(sorted)
  }

  React.useEffect(async () => {
    projectStore.on('projects/updated', onUpdated)
    const projects = await projectStore.getProjects()
    onUpdated({ projects })

    return () => {
      projectStore.off('projects/updated', onUpdated)
    }
  }, [])

  const handleCreate = () => projectStore.createProject()
  const handleSearch = value => setFilter(value.toLowerCase())
  const handleFocusList = () => ref.current.focus()

  const handleOpen = id => console.log('onOpen', id)
  const handleBack = id => console.log('onBack', id)
  const handleFocus = id => console.log('onFocus', id)
  const handleSelect = id => console.log('onSelect', id)

  const project = ([id, project], props) => <Project
    id={id}
    project={project}
    { ...props }
  />

  const id = project => project[0]

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
        entries={projects.filter(([_, project]) => project.name.toLowerCase().includes(filter))}
        entry={project}
        id={id}
        onOpen={handleOpen}
        onBack={handleBack}
        onFocus={handleFocus}
        onSelect={handleSelect}
      />
    </div>
  )
}
