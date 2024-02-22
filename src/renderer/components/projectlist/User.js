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

  const displayMembership = membership => {
    switch (membership) {
      case 'invite': return 'Invited'
      case 'join': return 'Joined'
      case 'ban': return 'Banned'
      default: return membership
    }
  }

  const getCSSClass = membership => {
    if (!membership) return ''
    return `mm-${membership}`
  }

  return (
    <div
      key={props.id}
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
// <div className={`mm-membership ${getCSSClass(entry.membership)}`}>{displayMembership(entry.membership)} ({entry.role})</div>

User.propTypes = {
  entry: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  selected: PropTypes.bool
}

const userProvider = onClick => props => {

  const injected = { ...props, onClick }
  return <User {...injected} />
}

export default User
export {
  userProvider
}
