import React from 'react'
import PropTypes from 'prop-types'
import { Card } from './Card'
import Avatar from './Avatar'

import './ProjectList.css'


const User = props => {
  const { entry } = props

  const handleClick = () => {
    props.onClick(props.id)
  }

  return (
    <div
      style={{ padding: '3px 6px' }}
    >
      <Card
          onClick={handleClick}
          selected={props.selected}
          id={props.id} >
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <Avatar entry={entry} />
          <div>
            <div className='card-title'>{entry.displayName ? entry.displayName : entry.userId}</div>
            <div className='card-content'>{entry.userId}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}


User.propTypes = {
  entry: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  selected: PropTypes.bool
}

const UserWrapper = ({ onClick, ...props }) => {
  return <User key={props.id} onClick={onClick} {...props} />
}

UserWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func
}

const userProvider = onClick => props => {
  return <UserWrapper onClick={onClick} {...props} />
}

export default User
export {
  userProvider
}
