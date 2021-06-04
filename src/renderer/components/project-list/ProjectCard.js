import React from 'react'
import PropTypes from 'prop-types'
import { militaryFormat } from '../../../shared/datetime'
import { useServices } from '../services'
import { ProjectTitleInput } from './ProjectTitleInput'
import { ProjectMedia } from './ProjectMedia'
import { CustomButton } from './CustomButton'

export const ProjectCard = props => {
  const { ipcRenderer, projectStore } = useServices()
  const { id, project, dispatch } = props
  const send = message => () => ipcRenderer.send(message, id)
  const handleTitleChange = name => dispatch({ type: 'renameProject', id, name })
  const loadPreview = () => projectStore.getPreview(id)

  return (
    <div className='card' tabIndex={0}>
      <div className='cardcontent'>
        <ProjectTitleInput value={project.name} onChange={handleTitleChange}/>
        <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

        <div style={{
          display: 'flex',
          marginTop: 'auto',
          gap: '8px'
        }}>
          <CustomButton onClick={send('OPEN_PROJECT')} text='Open'/>
          <CustomButton onClick={send('EXPORT_PROJECT')} text='Export'/>
          <CustomButton
            danger
            onClick={() => dispatch({ type: 'deleteProject', id })}
            style={{ marginLeft: 'auto' }}
            text='Delete'
          />
        </div>
      </div>
      <ProjectMedia loadPreview={loadPreview}/>
    </div>
  )
}

ProjectCard.propTypes = {
  id: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
}
