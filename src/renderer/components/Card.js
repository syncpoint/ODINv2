import React from 'react'
import PropTypes from 'prop-types'
import { CardTitle } from './CardTitle'

export const Card = React.forwardRef((props, ref) => {
  const { children, selected } = props
  const className = props.focused
    ? 'card focus'
    : 'card'

  return (
    <div
      ref={ref}
      className={className}
      aria-selected={selected}
      role='option'
      onClick={event => props.onClick && props.onClick(event)}
      onDoubleClick={event => props.onDoubleClick && props.onDoubleClick(event)}
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
