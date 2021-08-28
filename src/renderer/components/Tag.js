import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { MemoizedTagIcon } from './TagIcon'

export const Tag = props => {
  const { variant, children } = props
  const closable = variant === 'USER'

  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const handleClose = () => props.onClose && props.onClose()
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
        <MemoizedTagIcon
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
  variant: PropTypes.string.isRequired,
  action: PropTypes.string,
  children: PropTypes.node.isRequired,
  capabilities: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onClose: PropTypes.func
}

export const MemoizedTag = React.memo(Tag)
