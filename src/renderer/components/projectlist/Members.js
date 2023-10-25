import React from 'react'
import { List } from './List'
import { userProvider } from './User'
import { useList } from '../hooks'
import './ProjectList.css'


const Members = props => {
  const [state, dispatch] = useList({ multiselect: false })
  const { memberlist, handleSelect } = props

  React.useEffect(() => {
    dispatch({ type: 'entries', entries: memberlist })
  }, [dispatch, memberlist])

  React.useEffect(() => {
    handleSelect(state.selected)
  }, [handleSelect, state])

  const handleClick = id => {
    dispatch({ type: 'select', id })
  }

  const child = userProvider(handleClick)

  return (
    <List child={child} { ...state } />
  )
}

export default Members
