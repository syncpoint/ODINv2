import React from 'react'
import PropTypes from 'prop-types'
import Icon from '@mdi/react'

export const TagIcon = React.memo(props => {
  const { path, closable, color } = props

  const className = closable
    ? 'tag-icon tag-close-icon'
    : 'tag-icon'

  return (
    <span className={className}>
      <Icon path={path} size='12px' color={color}/>
    </span>
  )
})

TagIcon.propTypes = {
  path: PropTypes.string.isRequired,
  closable: PropTypes.bool,
  color: PropTypes.string
}
