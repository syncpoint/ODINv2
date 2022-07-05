import * as R from 'ramda'
import React from 'react'
import { FilterInput, IndexBackedList, History } from '.'
import { useList, useStack, useServices, useMemento } from './hooks'
import { cmdOrCtrl } from '../platform'
import { isLayerId, isFeatureId } from '../ids'
import { matcher, preventDefault } from './events'
import { Entries } from './selection'
import './Sidebar.css'

const scopeGroup = {
  key: 'layer',
  scope: '@layer',
  label: 'Layers',
  items: [
    { key: 'layer', scope: '@layer', label: 'Layers' },
    { key: 'feature', scope: '@feature', label: 'Features' },
    { key: 'link', scope: '@link', label: 'Links' },
    { key: 'symbol', scope: '@symbol', label: 'Symbols' },
    { key: 'marker', scope: '@marker', label: 'Markers' },
    { key: 'pinned', scope: '#pin', label: 'Pinned' }
  ]
}

/**
 * Top-most component, combining history, filter input and
 * concrete filterable list, e.g. feature list.
 */
const Sidebar = () => {
  const { selection } = useServices()
  const [listState, listDispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')
  const [historyEntries, historyDispatch] = useStack([scopeGroup])
  const ref = React.useRef()
  const [showing] = useMemento('ui.sidebar.showing', true)

  // Reset filter on each history update:
  React.useEffect(() => setFilter(''), [historyEntries])

  // Focus sidebar AFTER edit:
  React.useEffect(() => {
    if (!ref.current) return
    if (!listState.editId) ref.current.focus()
  }, [listState.editId])

  const handleClick = () => selection.set([])

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp'
    ], preventDefault)(event)

    // History: Back.
    if (cmdOrCtrl(event) && event.key === 'ArrowUp') {
      if (historyEntries.length > 1) historyDispatch({ type: 'pop' })
    }

    // History: Open details.
    if (cmdOrCtrl(event) && event.key === 'ArrowDown') {
      if (listState.selected.length !== 1) return

      const focusId = listState.selected[listState.selected.length - 1]
      const focusIndex = Entries.focusIndex(listState)

      if (isLayerId(focusId)) {
        const layerId = focusId.split(':')[1]

        historyDispatch({
          type: 'push',
          entry: {
            key: focusId,
            scope: `@feature @link !feature:${layerId} !link+layer:${layerId}`,
            label: listState.entries[focusIndex].title || 'N/A'
          }
        })
      } else if (isFeatureId(focusId)) {
        historyDispatch({
          type: 'push',
          entry: {
            key: focusId,
            scope: `@link !link+feature:${focusId.split(':')[1]}`,
            label: listState.entries[focusIndex].title || 'N/A'
          }
        })
      }
    }

    const { key, shiftKey, metaKey, ctrlKey } = event
    listDispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  // Reset ongoing editing if anything (i.e. card title) lost focus.
  const handleBlur = event => {
    if (event.target === ref.current) return
    listDispatch({ type: 'blur' })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])
  if (!showing) return null

  return (
    <div className="sidebar">
      <div
        ref={ref}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <History entries={historyEntries} dispatch={historyDispatch}/>
        <div style={{ display: 'flex', padding: '0.5em' }}>
          <FilterInput size='large' value={filter} onChange={handleFilterChange}/>
        </div>

        <IndexBackedList
          scope={R.last(historyEntries).scope}
          history={history}
          filter={filter}
          dispatch={listDispatch}
          state={listState}
        />
      </div>
    </div>
  )
}

Sidebar.whyDidYouRender = true

const SidebarMemo = React.memo(Sidebar)
SidebarMemo.whyDidYouRender = true
export { SidebarMemo as Sidebar }
