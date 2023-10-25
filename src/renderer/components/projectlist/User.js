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
      key={props.id}
      style={{ padding: '3px 6px' }}
    >
      <Card
          onClick={handleClick}
          selected={props.selected}
          id={props.id} >
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar entry={entry} />
          <div className='card-title'>{entry.displayName ?? entry.userId}</div>
          <div className='mm-membership'>{`${entry.membership.toUpperCase()}ED`}</div>
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

const userProvider = onClick => props => {

  const injected = { ...props, onClick }
  return <User {...injected} />
}

export default User
export {
  userProvider
}
