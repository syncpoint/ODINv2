// import './wdyr'
import ReactDOM from 'react-dom'
import React from 'react'
import 'antd/dist/antd.css'
import 'typeface-roboto'
import './index.css'
import { Project } from './components/Project'
import projectServices from './components/Project-services'
import { ProjectList } from './components/ProjectList'
import projectListServices from './components/ProjectList-services'
import { ServiceProvider } from './components/hooks'


// Clipboard events: Handlers must evaluate target element to determin context.
document.addEventListener('copy', event => console.log('[index] copy', event))
document.addEventListener('cut', event => console.log('[index] cut', event))
document.addEventListener('paste', event => console.log('[index] paste', event))

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()

const projectUUID = page => page.split(':')[1]

const services = page === 'splash'
  ? projectListServices()
  : projectServices(projectUUID(page))

const app = (
  <ServiceProvider { ...services }>
  { page === 'splash' ? <ProjectList/> : <Project/> }
  </ServiceProvider>
)

const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(app, container)
