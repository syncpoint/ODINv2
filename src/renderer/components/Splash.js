import { ipcRenderer } from 'electron'
import React from 'react'
import PropTypes from 'prop-types'
import * as Registry from '../registry'
import Store from '../../shared/level/Store'

// /* eslint-disable */

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
  return <div onDoubleClick={props.onDoubleClick} style={{
    display: 'flex',
    flexDirection: 'row',
    margin: '8px',
    borderRadius: '8px',
    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em, rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset'
  }}>
    { props.children }
  </div>
}

Card.propTypes = {
  children: PropTypes.array,
  onDoubleClick: PropTypes.func.isRequired
}

const CardContent = props => {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto'
  }}>
    { props.children }
  </div>
}

CardContent.propTypes = {
  children: PropTypes.array,
  onDoubleClick: PropTypes.func.isRequired
}

const CardMedia = props => {
  return props.children
}

const ProjectList = props => {
  const width = 320
  const height = 240
  const scale = 0.75

  const projectCard = project => <Card
    key={project.id}
    onDoubleClick={props.onDoubleClick(project.id)}
  >
    <CardContent name={project.name} lastAccess={project.lastAccess}>
    <span style={{
      padding: '16px',
      fontSize: '120%'
    }}>{project.name}
    </span>
    <span style={{
      paddingLeft: '16px',
      fontSize: '100%'
    }}>{project.lastAccess}
    </span>
    </CardContent>
    <CardMedia >
      <DeferredImage fetch={props.fetch(project.id)} width={width} height={height} scale={scale}/>
    </CardMedia>
  </Card>

  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    margin: '0'
  }}>
    { props.projects.map(projectCard)}
  </div>
}

ProjectList.propTypes = {
  projects: PropTypes.array.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
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
  const onDoubleClick = id => () => {
    console.log('onDoubleClick', id)
    ipcRenderer.send('OPEN_PROJECT', id)
  }

  return <ProjectList
    projects={projects}
    fetch={fetch}
    onDoubleClick={onDoubleClick}
  >

  </ProjectList>
}
