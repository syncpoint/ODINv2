import * as R from 'ramda'
import React from 'react'
import { FilterInput, IndexBackedList } from '.'
import { useList } from './hooks'

/**
 * Top-most component, combining filter input and
 * concrete filterable list, e.g. feature list.
 */
const Marc = () => {
  const [state, dispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')

  const handleKeyDown = event => {
    // console.log('<Marc/> handleKeyDown', event)

    const preventDefault = R.cond([
      [({ key }) => key === 'ArrowDown', R.always(true)],
      [({ key }) => key === 'ArrowUp', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()

    const { key, shiftKey, metaKey, ctrlKey } = event
    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', padding: '6px' }}>
        <FilterInput size='large' onChange={handleFilterChange}/>
      </div>
      <IndexBackedList scope='feature' filter={filter} dispatch={dispatch} state={state}/>
    </div>
  )
}

Marc.whyDidYouRender = true

/**
 * Prevent Marc from re-rendering when Workspace updated
 * one if Marcs siblings (e.g. command palette).
 */
const MarcMemo = React.memo(Marc)
MarcMemo.whyDidYouRender = true

export { MarcMemo as Layers }
