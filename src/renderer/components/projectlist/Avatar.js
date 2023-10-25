import React from 'react'
import PropTypes from 'prop-types'
import './ProjectList.css'

const Avatar = props => {
  const { entry } = props

  const width = '48px'
  const height = '48px'

  const abreviate = entry => {
    if (entry.displayName) return entry.displayName.substring(0, 1).toUpperCase()
    return entry.userId.substring(1, 1).toUpperCase()
  }

  const placeholder = (text = null) => (
    <div className='placeholder' style={{ width, height }}>
      { text }
    </div>
  )

  if (!entry.avatarUrl) return (placeholder(abreviate(entry)))
  return (
    <img src={entry.avatarUrl} width={width} height={height} style={{ objectFit: 'cover', borderRadius: '25%', alignSelf: 'center' }}/>
  )
}
Avatar.propTypes = {
  entry: PropTypes.object.isRequired
}

export default Avatar
