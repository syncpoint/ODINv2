import { ipcRenderer } from 'electron'
import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'
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

const Project = props => {
  const { project } = props

  const width = 320
  const height = 240
  const scale = 0.75

  const send = message => () => ipcRenderer.send(message, project.id)

  return <Card>
    <CardContent>
      <span className='cardtitle'>{project.name}</span>
      <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

      <div style={{
        display: 'flex',
        marginTop: 'auto',
        gap: '8px'
      }}>
        <Button style={{ backgroundColor: 'inherit' }} onClick={send('OPEN_PROJECT')}>Open</Button>
        <Button style={{ backgroundColor: 'inherit' }} onClick={send('EXPORT_PROJECT')}>Export</Button>
        <Button danger style={{ backgroundColor: 'inherit' }} onClick={send('DELETE_PROJECT')}>Delete</Button>
      </div>
    </CardContent>
    <DeferredImage fetch={props.fetch(project.id)} width={width} height={height} scale={scale}/>
  </Card>
}

Project.propTypes = {
  project: PropTypes.object.isRequired,
  fetch: PropTypes.func.isRequired
}

const ProjectList = props => {
  const project = project => <Project
    key={project.id}
    project={project}
    fetch={props.fetch}
  />

  return <div className="projectlist">
    { props.projects.map(project)}
  </div>
}

ProjectList.propTypes = {
  projects: PropTypes.array.isRequired,
  fetch: PropTypes.func.isRequired
}


export const Splash = () => {
  const master = Registry.get(Registry.MASTER)
  const store = new Store(master)
  const [projects, setProjects] = React.useState([])

  React.useEffect(async () => {
    const projects = await new Promise((resolve, reject) => {
      const acc = []
      master.createReadStream({ keys: true, values: true, gte: 'project:', lte: 'project:\xff' })
        .on('data', ({ key, value }) => acc.push({ id: key, ...value }))
        .on('error', err => reject(err))
        .on('end', () => resolve(acc))
    })

    setProjects(projects)
  }, [])

  const fetch = key => () => store.get(`preview:${key}`, null)

  return <ProjectList
    projects={projects}
    fetch={fetch}
  >

  </ProjectList>
}
