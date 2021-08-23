import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { TagIcon } from './TagIcon'

export const Tag = React.memo(props => {
  const { variant, children } = props
  const closable = variant === 'USER'

  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  return (
    <span
      className={className}
      // onClick={handleClick}
      // onDoubleClick={handleDoubleClick}
      // onMouseDown={handleMouseDown}
      // onMouseUp={handleMouseUp}
    >
      { children }
      {
        closable &&
        props.capabilities.includes('TAG') &&
        <TagIcon
          path={mdi.mdiClose}
          closable={closable}
          // onClose={props.onClose}
          color='grey'
        />
      }
    </span>
  )
})

Tag.propTypes = {
  variant: PropTypes.string.isRequired,
  action: PropTypes.string,
  children: PropTypes.node.isRequired,
  capabilities: PropTypes.string
}
