import React from 'react'
import PropTypes from 'prop-types'
import Avatar from './Avatar'

import './User.css'


const User = React.forwardRef((props, ref) => {
  const { entry, id, selected, onClick } = props

  const handleClick = () => onClick && onClick(id)

  return (
    <div
      ref={ref}
      className={`user-item${selected ? ' user-item--selected' : ''}`}
      onClick={handleClick}
      role='option'
      aria-selected={selected}
    >
      <Avatar entry={entry} size={32} />
      <div className='user-item__info'>
        <span className='user-item__name'>
          {entry.displayName || entry.userId}
        </span>
        <span className='user-item__id'>{entry.userId}</span>
      </div>
      {entry.role && (
        <span className={`user-item__role user-item__role--${entry.role?.toLowerCase()}`}>
          {entry.role}
        </span>
      )}
    </div>
  )
})

User.displayName = 'User'

User.propTypes = {
  entry: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  selected: PropTypes.bool
}

const userProvider = onClick => props => {
  return <User onClick={onClick} {...props} />
}

export default User
export { userProvider }
