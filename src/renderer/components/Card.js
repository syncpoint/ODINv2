import React from 'react'
import PropTypes from 'prop-types'
import { CardTitle } from './CardTitle'

export const Card = React.forwardRef((props, ref) => {
  const { children, selected } = props
  const className = props.focused
    ? 'card focus'
    : 'card'

  const handleClick = event => {
    props.onClick && props.onClick(event)
  }

  const handleDoubleClick = event => {
    props.onDoubleClick && props.onDoubleClick(event)
  }

  return (
    <div
      ref={ref}
      className={className}
      aria-selected={selected}
      role='option'
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  )
})

Card.propTypes = {
  children: PropTypes.node.isRequired,
  focused: PropTypes.bool,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func
}

Card.Title = CardTitle
