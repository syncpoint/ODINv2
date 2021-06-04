import React from 'react'
import PropTypes from 'prop-types'
import { ProjectCard } from './ProjectCard'

export const ProjectList = props => {
  const project = ([id, project]) => <ProjectCard
    key={id}
    id={id}
    project={project}
    dispatch={props.dispatch}
  />

  return (
    <div role='listbox' className="projectlist">
      { props.projects.map(project)}
    </div>
  )
}

ProjectList.propTypes = {
  projects: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired
}
