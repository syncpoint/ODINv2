import React from 'react'
import { Project } from './Project'
import projectServices from './Project-services'
import { ProjectList } from './ProjectList'
import projectListServices from './ProjectList-services'
import { ServiceProvider } from './hooks'

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()

const projectUUID = page => page.split(':')[1]

export const App = () => {
  const [services, setServices] = React.useState(null)

  React.useEffect(() => {
    const promise = page === 'splash'
      ? Promise.resolve(projectListServices())
      : Promise.resolve(projectServices(projectUUID(page)))
    promise.then(services => setServices(services))
  }, [])

  const component = services
    ? <ServiceProvider { ...services }>
      { page === 'splash' ? <ProjectList/> : <Project/> }
      </ServiceProvider>
    : null

  return component
}
