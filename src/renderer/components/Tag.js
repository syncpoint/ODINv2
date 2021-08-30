import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { TagIcon } from './TagIcon'

/**
 * A tag in different variants.
 */
export const Tag = props => {
  const { variant, children, onClose } = props
  const closable = variant === 'USER'

  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const handleClose = () => onClose && onClose()

  const handleClick = event => {
    event.stopPropagation()
    props.onClick && props.onClick(event)
  }

  return (
    <span
      className={className}
      onClick={handleClick}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
    >
      { children }
      {
        closable &&
        props.capabilities.includes('TAG') &&
        <TagIcon
          path={mdi.mdiClose}
          closable={closable}
          onClose={handleClose}
          color='grey'
        />
      }
    </span>
  )
}

Tag.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  action: PropTypes.string,
  capabilities: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onClose: PropTypes.func
}
