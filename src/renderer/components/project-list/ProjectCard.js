import React from 'react'
import PropTypes from 'prop-types'
import { militaryFormat } from '../../../shared/datetime'
import { useServices } from '../services'
import { ProjectTitleInput } from './ProjectTitleInput'
import { ProjectMedia } from './ProjectMedia'
import { CustomButton } from './CustomButton'

const ButtonBar = props => (
  <div style={{
    display: 'flex',
    marginTop: 'auto',
    gap: '8px'
  }}>
    {props.children}
  </div>
)

ButtonBar.propTypes = {
  children: PropTypes.array.isRequired
}

export const ProjectCard = props => {
  const { ipcRenderer, projectStore } = useServices()
  const { id, project } = props
  const send = message => () => ipcRenderer.send(message, id)
  const loadPreview = () => projectStore.getPreview(id)

  const handleRename = name => projectStore.updateProject(id, { ...project, name })
  const handleDelete = () => projectStore.addTag(id, project, 'deleted')

  return (
    <div
      className='card'
      tabIndex={0}
    >
      <div className='cardcontent'>
        <ProjectTitleInput value={project.name} onChange={handleRename}/>
        <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

        <ButtonBar>
          <CustomButton onClick={send('OPEN_PROJECT')} text='Open'/>
          <CustomButton onClick={send('EXPORT_PROJECT')} text='Export'/>
          <CustomButton
            danger
            onClick={handleDelete}
            style={{ marginLeft: 'auto' }}
            text='Delete'
          />
        </ButtonBar>
      </div>
      <ProjectMedia loadPreview={loadPreview}/>
    </div>
  )
}

ProjectCard.propTypes = {
  id: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired
}
