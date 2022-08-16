/* eslint-disable react/prop-types */
import React from 'react'
import Icon from '@mdi/react'

/**
 * Icon which is a tag.
 */
export const IconTag = props => {
  const { path, ...rest } = props

  return (
    <span className='e3de-tag e3de-tag--system e3de-icon-tag' {...rest}>
      <Icon path={path}/>
    </span>
  )
}
