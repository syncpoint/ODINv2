import * as R from 'ramda'
import React from 'react'
import { FilterInput, IndexBackedList, History } from '.'
import { useList, useStack } from './hooks'
import { cmdOrCtrl } from '../platform'
import { isLayerId, isFeatureId } from '../ids'


/**
 * Top-most component, combining history. filter input and
 * concrete filterable list, e.g. feature list.
 */
const Marc = () => {
  const [state, dispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')

  const stickyHistoryEntry = {
    key: 'layer',
    scope: '@id:layer',
    label: 'Layers',
    items: [
      { key: 'layer', scope: '@id:layer', label: 'Layers' },
      { key: 'feature', scope: '@id:feature', label: 'Features' },
      { key: 'link', scope: '@id:link', label: 'Links' },
      { key: 'view', scope: '@id:view', label: 'Views' },
      { key: 'pinned', scope: '#pin', label: 'Pinned' }
    ]
  }

  const history = useStack([stickyHistoryEntry])

  // Reset filter on each history update:
  React.useEffect(() => setFilter(''), [history.entries])

  const handleKeyDown = event => {
    const preventDefault = R.cond([
      [({ key }) => key === 'ArrowDown', R.always(true)],
      [({ key }) => key === 'ArrowUp', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()

    if (cmdOrCtrl(event) && event.key === 'ArrowUp') {
      if (history.entries.length > 1) history.pop()
    }

    if (cmdOrCtrl(event) && event.key === 'ArrowDown') {
      if (!state.focusId) return
      if (isLayerId(state.focusId)) {
        history.push({
          key: state.focusId,
          scope: `@id:feature:${state.focusId.split(':')[1]}`,
          label: state.entries[state.focusIndex].title
        })
      } else if (isFeatureId(state.focusId)) {
        history.push({
          key: state.focusId,
          scope: `@id:link @ref:${state.focusId}`,
          label: state.entries[state.focusIndex].title
        })
      }
    }

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
      <History stack={history}/>
      <div style={{ display: 'flex', padding: '8px' }}>
        <FilterInput size='large' value={filter} onChange={handleFilterChange}/>
      </div>
      <IndexBackedList
        scope={history.peek().scope}
        history={history}
        filter={filter}
        dispatch={dispatch}
        state={state}
      />
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
