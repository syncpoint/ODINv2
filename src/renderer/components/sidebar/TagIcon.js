/* eslint-disable react/prop-types */
import React from 'react'
import Icon from '@mdi/react'

/**
 * Icon inside a tag.
 */
export const TagIcon = props => {
  const { path, removable } = props

  const handleClick = event => {
    event.stopPropagation()
    props.onClick && props.onClick()
  }

  const className = removable
    ? 'e3de-tag-icon e3de-tag-close-icon'
    : 'e3de-tag-icon'

  return (
    <Icon path={path} className={className} onClick={handleClick}/>
  )
}
