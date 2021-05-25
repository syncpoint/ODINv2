import { ipcRenderer } from 'electron'
import React from 'react'
import PropTypes from 'prop-types'
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
    onDoubleClick={props.onDoubleClick}
  >
    { props.children }
  </div>
}

Card.propTypes = {
  children: PropTypes.array,
  onDoubleClick: PropTypes.func.isRequired
}

const CardContent = props => {
  return <div className='cardcontent'>
    { props.children }
  </div>
}

CardContent.propTypes = {
  children: PropTypes.array
}

const ProjectList = props => {
  const width = 320
  const height = 240
  const scale = 0.75

  const projectCard = project => <Card
    key={project.id}
    onDoubleClick={props.onDoubleClick(project.id)}
  >
    <CardContent>
      <span className='cardtitle'>{project.name}</span>
      <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

      {/* TODO: buttons: OPEN, EXPORT, DELETE */}
      <div style={{
        display: 'grid',
        columnGap: '16px',
        gridTemplateColumns: 'auto auto auto'
      }}>
        <button className="button">Open</button>
        <button className="button">Export</button>
        <button style={{ color: 'red' }} className="button">Delete</button>
      </div>
    </CardContent>
    <DeferredImage fetch={props.fetch(project.id)} width={width} height={height} scale={scale}/>
  </Card>

  return <div className="projectlist">
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
    ipcRenderer.send('OPEN_PROJECT', id)
  }

  return <ProjectList
    projects={projects}
    fetch={fetch}
    onDoubleClick={onDoubleClick}
  >

  </ProjectList>
}
