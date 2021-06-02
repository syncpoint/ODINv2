import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'
import { militaryFormat } from '../../../shared/datetime'
import { useServices } from '../services'
import { ProjectTitleInput } from './ProjectTitleInput'
import { ProjectMedia } from './ProjectMedia'

export const ProjectCard = props => {
  const { ipcRenderer, projectStore } = useServices()
  const { id, project, editing, dispatch } = props
  const send = message => () => ipcRenderer.send(message, id)
  const handleTitleChange = name => dispatch({ type: 'renameProject', id, name })
  const loadPreview = () => projectStore.getPreview(id)

  const editButton = editing
    ? <Button
        type='link'
        danger
        onClick={() => dispatch({ type: 'deleteProject', id })}
        style={{ marginLeft: 'auto' }}
      >Delete</Button>
    : null

  return (
    <div className='card'>
      <div className='cardcontent'>
        <ProjectTitleInput value={project.name} onChange={handleTitleChange} editing={editing}/>
        <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

        <div style={{
          display: 'flex',
          marginTop: 'auto'
        }}>
          <Button type='link' disabled={editing} onClick={send('OPEN_PROJECT')}>Open</Button>
          <Button type='link' disabled={editing} onClick={send('EXPORT_PROJECT')}>Export</Button>
          { editButton }
        </div>
      </div>
      <ProjectMedia loadPreview={loadPreview}/>
    </div>
  )
}

ProjectCard.propTypes = {
  id: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
}
