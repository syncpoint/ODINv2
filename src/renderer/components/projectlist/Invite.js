import React from 'react'
import PropTypes from 'prop-types'
import { List } from './List'
import { useList } from '../hooks'
import { userProvider } from './User'
import './ProjectList.css'

const Invite = props => {

  const { replication, handleSelect } = props

  const [state, dispatch] = useList({ multiselect: false })
  const [query, setQuery] = React.useState('')
  const deferredQuery = React.useDeferredValue(query)

  const FQUN = /^@.{1,}:.{1,}/

  React.useEffect(() => {
    const doSearch = async () => {
      if (!query) {
        dispatch({ type: 'entries', entries: [] })
        return
      }
      const jobs = [replication.searchUsers(query)]
      if (query.match(FQUN)) {
        jobs.push(replication.profile(query))
      }

      const r = (await Promise.all(jobs)).flat()
      const modified = r
        .filter(u => u !== null)
        .map(u => ({ ...u, id: u.userId }))
      dispatch({ type: 'entries', entries: modified })
    }
    doSearch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery])

  React.useEffect(() => {
    handleSelect(state.selected)
  }, [state, handleSelect])


  const handleClick = id => {
    dispatch({ type: 'select', id })
  }

  const child = userProvider(handleClick)

  return (
    <>
      <input className='search' placeholder='Search for users ...' onChange={e => setQuery(e.target.value)} value={query} />
      <List child={child} { ...state } />
    </>
  )
}

export default Invite
Invite.propTypes = {
  handleSelect: PropTypes.func.isRequired,
  replication: PropTypes.object.isRequired
}
