/* eslint-disable */

import React from 'react'
import PropTypes from 'prop-types'
import { militaryFormat } from '../../../shared/datetime'
import { useServices } from '../services'
import { Title } from './Title'
import { Media } from './Media'
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

export const Project = props => {
  // TODO: remove dependencies on ipc and store if possible
  const { ipcRenderer, projectStore } = useServices()
  const { id, project, focused } = props
  const send = message => () => ipcRenderer.send(message, id)
  const loadPreview = () => projectStore.getPreview(id)
  const handleRename = name => projectStore.updateProject(id, { ...project, name })
  const handleDelete = () => projectStore.deleteProject(id)

  const isOpen = props.project.tags
    ? props.project.tags.includes('OPEN')
    : false

  return (
    <div
      className='project'
      tabIndex={0}
      aria-selected={focused}
    >
      <div className='cardcontent'>
        <Title value={project.name} onChange={handleRename}/>
        <span className='cardtext'>{militaryFormat.fromISO(project.lastAccess)}</span>

        <ButtonBar>
          <CustomButton onClick={send('OPEN_PROJECT')} text='Open'/>
          <CustomButton onClick={send('EXPORT_PROJECT')} text='Export'/>
          <CustomButton
            danger
            onClick={handleDelete}
            style={{ marginLeft: 'auto' }}
            text='Delete'
            disabled={isOpen}
          />
        </ButtonBar>
      </div>
      <Media loadPreview={loadPreview}/>
    </div>
  )
}

Project.propTypes = {
  id: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  focused: PropTypes.bool.isRequired
}
