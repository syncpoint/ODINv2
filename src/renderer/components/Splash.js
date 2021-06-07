import React from 'react'
import { Button, Input } from 'antd'
import { useServices } from './services'
import { ProjectList } from './project-list'

export const Splash = () => {
  const { projectStore } = useServices()
  const { Search } = Input
  const [projects, setProjects] = React.useState([])

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

  const onSearch = () => console.log('search')
  const handleNew = () => projectStore.createProject()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px'
      }}>
        <Search placeholder="Search project" onSearch={onSearch}/>
        <Button onClick={handleNew}>New</Button>
        <Button>Import</Button>
      </div>
      <ProjectList
        projects={projects}
      />
    </div>
  )
}
