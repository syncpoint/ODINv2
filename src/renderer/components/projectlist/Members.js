import React from 'react'
import PropTypes from 'prop-types'
import { List } from './List'
import { Card } from './Card'
import { Button } from './Button'
import { useList } from '../hooks'
import './ProjectList.css'

const Avatar = props => {
  const { entry } = props

  const width = '30px'
  const height = '30px'

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



const Member = props => {
  const { entry } = props
  return (
    <div key={entry.userId}>
      <Card id={entry.userId}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'baseline' }}>
          <Avatar entry={entry} />
          <div className='card-title'>{entry.displayName ?? entry.userId}</div>
          <div style={{ marginLeft: 'auto' }}>
            <Button>Kick</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
Member.propTypes = {
  entry: PropTypes.object.isRequired
}

const Members = props => {
  const [state, dispatch] = useList({ multiselect: false })
  const { memberlist, permissions } = props

  React.useEffect(() => {
    dispatch({ type: 'entries', entries: memberlist })
  }, [dispatch, memberlist])


  return (
    <List child={Member} { ...state } />
  )
}

export default Members
