import React from 'react'
import PropTypes from 'prop-types'
import { ProjectCard } from './ProjectCard'

export const ProjectList = props => {
  const project = ([id, project]) => <ProjectCard
    key={id}
    id={id}
    project={project}
  />

  return (
    <div role='listbox' className="projectlist">
      { props.projects.map(project)}
    </div>
  )
}

ProjectList.propTypes = {
  // FIXME: use `children` instead
  projects: PropTypes.array.isRequired
}
