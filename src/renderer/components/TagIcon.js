import React from 'react'
import PropTypes from 'prop-types'
import Icon from '@mdi/react'

export const TagIcon = props => {
  const { path, closable, color } = props

  const handleClick = event => {
    event.stopPropagation()
    props.onClose && props.onClose()
  }

  const className = closable
    ? 'tag-icon tag-close-icon'
    : 'tag-icon'

  return (
    <span className={className} onClick={handleClick}>
      <Icon path={path} size='12px' color={color}/>
    </span>
  )
}

TagIcon.propTypes = {
  path: PropTypes.string.isRequired,
  closable: PropTypes.bool,
  color: PropTypes.string,
  onClose: PropTypes.func
}

export const MemoizedTagIcon = React.memo(TagIcon)
