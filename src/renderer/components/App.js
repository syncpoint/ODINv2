import React from 'react'
import { Project } from './Project'
import projectServices from './Project-services'
import { ProjectList } from './projectlist/ProjectList'
import projectListServices from './ProjectList-services'
import { ServiceProvider } from './hooks'
import { Login } from './collaboration/Login'
import { Logout } from './collaboration/Logout'
import * as R from 'ramda'

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()

const projectUUID = page => page.split(':')[1]

const resolveServices = R.cond([
  [R.equals('splash'), R.always(Promise.resolve(projectListServices()))],
  [R.equals('login'), R.always(Promise.resolve(projectListServices()))],
  [R.equals('logout'), R.always(Promise.resolve(projectListServices()))],
  [R.T, page => Promise.resolve(projectServices(projectUUID(page)))]
])

const resolveComponents = R.cond([
  [R.equals('splash'), R.always(<ProjectList/>)],
  [R.equals('login'), R.always(<Login/>)],
  [R.equals('logout'), R.always(<Logout/>)],
  [R.T, () => <Project/>]
])

export const App = () => {
  const [services, setServices] = React.useState(null)

  React.useEffect(() => {
    resolveServices(page).then(
      services => setServices(services)
    )
  }, [])

  const component = services
    ? <ServiceProvider { ...services }>
      {
        resolveComponents(page)
      }
      </ServiceProvider>
    : null

  return component
}
