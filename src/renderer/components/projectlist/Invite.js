import React from 'react'
import PropTypes from 'prop-types'
import SearchResult from './SearchResults'
import { FilterInput } from './FilterInput'

const Invite = props => {

  const { projectId, replication } = props

  const [query, setQuery] = React.useState('')
  const deferredQuery = React.useDeferredValue(query)

  const [result, setResult] = React.useState([])

  React.useEffect(() => console.log(`${query} VS ${deferredQuery}`), [query, deferredQuery])

  React.useEffect(() => {
    const doSearch = async () => {
      const r = await replication.searchUsers(query)
      setResult(r)
    }
    doSearch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery])

  const handleInvite = async (userId) => {
    console.dir(userId)
    try {
      await replication.invite(projectId, userId)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <FilterInput placeholder='Search for users ...' onChange={e => setQuery(e)} value={query}/>
      <React.Suspense fallback={<h2>Loading...</h2>}>
        <SearchResult entries={result} onInvite={handleInvite}/>
      </React.Suspense>
    </>
  )
}

export default Invite
Invite.propTypes = {
  projectId: PropTypes.string.isRequired,
  replication: PropTypes.object.isRequired
}
