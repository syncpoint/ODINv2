import * as R from 'ramda'
import React from 'react'
import isEqual from 'react-fast-compare'
import { Disposable } from '../../../shared/disposable'
import * as ID from '../../ids'
import { useServices, useMemento, useEmitter } from '../hooks'
import { multiselect } from '../../model/selection/multiselect'
import { defaultSearch, defaultState } from './state'
import { matcher, preventDefault } from '../events'
import { cmdOrCtrl } from '../../platform'
import { ScopeSwitcher } from './ScopeSwitcher'
import { MemoizedCard } from './Card'
import { LazyList } from './LazyList'
import { FilterInput } from './FilterInput'
import './Sidebar.scss'


/**
 *
 */
const handlers = {
  'edit:keydown/Enter': state => {
    const editing = state.editing ? false : R.last(state.selected)
    return { ...state, editing }
  },
  'edit:keydown/Escape': state => {
    if (state.editing) return { ...state, editing: false }
    else if (state.selected.length) return { ...state, selected: [] }
    else return state
  },
  'edit:keydown/F2': state => {
    if (state.editing || state.selected.length === 0) return state
    else return { ...state, editing: R.last(state.selected) }
  },
  'edit:keydown/Tab': state => {
    if (state.editing) return { ...state, editing: false }
    else return state
  },
  edit: (state, { id }) => ({ ...state, editing: id })
}


/**
 *
 */
const reducer = (state, event) => {
  if (Array.isArray(event)) {
    // Recursively reduce composite event:
    //
    return event.reduce((state, event) => reducer(state, event), state)
  } else {
    // Find suitable handler for event: Either from sidebar-specific
    // `handlers` or list multiselect strategy.
    //
    const type = event.type
    const handler = handlers[type] || multiselect[type] || R.identity
    const next = handler(state, event)
    return next
  }
}


/**
 *
 */
const useModel = () => {
  const services = useServices()
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)
  const [state, dispatch] = React.useReducer(reducer, defaultState)
  const lastSearch = React.useRef()
  const emitter = useEmitter('sidebar')

  // ==> Internal callbacks.

  const setHistory = React.useCallback(history => {
    // Note: Setting/resetting history always resets filter.
    setSearch({ filter: '', history })
  }, [setSearch])

  // <== Internal callbacks.

  // ==> Effects.

  React.useEffect(() => {
    const { store } = services
    const pin = id => store.addTag(id, 'pin')
    const unpin = id => store.removeTag(id, 'pin')

    const link = id => {
      const entry = R.find(R.propEq('id', id), state.entries)
      setHistory([...search.history, {
        key: id,
        label: entry.title,
        scope: `@link !link+${id}`
      }])
    }

    const polygon = async id => {
      const entry = R.find(R.propEq('id', id), state.entries)
      const geometry = await store.geometry(id)
      setHistory([...search.history, {
        scope: `@feature &geometry:${JSON.stringify(geometry)}`,
        key: id,
        label: entry.title
      }])

    }

    const disposable = Disposable.of()
    disposable.on(emitter, 'edit', ({ id }) => dispatch({ type: 'edit', id }))
    disposable.on(emitter, 'pin', ({ id }) => pin(id))
    disposable.on(emitter, 'unpin', ({ id }) => unpin(id))
    disposable.on(emitter, 'link', ({ id }) => link(id))
    disposable.on(emitter, 'polygon', ({ id }) => polygon(id))
    return () => disposable.dispose()
  }, [emitter, services, state.entries, search.history, setHistory])

  // Fetch entries when history and/or filter changed.
  //
  React.useEffect(() => {
    const { searchIndex } = services
    const terms = `${R.last(search.history).scope} ${search.filter}`
    const options = { force: search.force }

    // Updated search/filter must clear any selection.
    //
    if (!isEqual(lastSearch.current, search)) {
      dispatch({ type: 'clear' })
    }

    const disposable = searchIndex.query(terms, options, entries => {
      // Note: (multiselect) strategy makes sure that state is only
      // updated when entries are not deep equal.
      dispatch({ type: 'entries', entries })
    })

    lastSearch.current = search
    return async () => (await disposable).dispose()
  }, [services, search])

  // Sync global selection with list model.
  //
  React.useEffect(() => {
    const { selection } = services

    // Note: State will not change if selection are the same.
    //
    const event = () => ({ type: 'selection', selected: selection.selected() })
    const disposable = Disposable.of()
    disposable.on(selection, 'selection', () => dispatch(event()))
    return () => disposable.dispose()
  }, [services])

  // Sync list selection with global selection.
  //
  React.useEffect(() => {
    const { selection } = services
    selection.set(state.selected)
  }, [services, state.selected])

  // Listen for focus event.
  // Mark entry in list model to be focus when it becomes available.
  // Switch scope according element's scope.
  //
  React.useEffect(() => {
    const { selection } = services
    const disposable = Disposable.of()
    disposable.on(selection, 'focus', ({ id }) => {
      const scope = ID.scope(id)
      dispatch({ type: 'focus', id }) // mark entry to be focused (focusId)
      setHistory([{ key: 'root', scope: `@${scope}`, label: scope }])
    })

    return () => disposable.dispose()
  }, [services, setHistory])

  // <== Effects.
  // ==> Event Handlers.

  const onKeyDown = React.useCallback(async event => {
    const { store } = services
    matcher([
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp'
    ], preventDefault)(event)

    const { key, shiftKey, metaKey, ctrlKey } = event
    dispatch([
      { type: `keydown/${key}`, shiftKey, metaKey, ctrlKey }, // list model
      { type: `edit:keydown/${key}`, shiftKey, metaKey, ctrlKey } // title inline editing
    ])

    if (!cmdOrCtrl(event)) return

    // Parent/child navigation.
    //
    if (event.key === 'ArrowUp' && search.history.length > 1) {
      setHistory(R.dropLast(1, search.history))
    } else if (event.key === 'ArrowDown' && state.focusIndex !== -1) {
      const focusId = R.last(state.selected)
      const label = state.entries[state.focusIndex].title || 'N/A'

      if (ID.isLayerId(focusId)) {
        const layerId = focusId.split(':')[1]
        setHistory([...search.history, {
          scope: `@feature @link !feature:${layerId} !link+layer:${layerId}`,
          key: focusId,
          label
        }])
      } else if (ID.isFeatureId(focusId)) {
        const geometry = await store.geometry(focusId)
        setHistory([...search.history, {
          scope: `@link !link+${focusId} @feature &geometry:${JSON.stringify(geometry)}`,
          key: focusId,
          label
        }])
      }
    }
  }, [services, state, search.history, setHistory])

  const onClick = React.useCallback(id => event => {
    const { selection } = services

    if (id) {
      // Card click must not bubble to list (see below.)
      event.stopPropagation()
      const { metaKey, ctrlKey, shiftKey } = event
      dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey })
    } else {
      // Reset selection on list click.
      selection.set([])
    }
  }, [services])

  const onFocus = React.useCallback(event => {
    dispatch({ type: 'focus' })
  }, [])


  // <== Event Handlers.

  return {
    state,
    onKeyDown,
    onClick,
    onFocus
  }
}

export const Sidebar = () => {

  // Current behavior:
  // On startup three renders are performed.
  // 1. initial state (no effects)
  // 2. after effect 'last search' and 'fetch entries'
  // 3. after entries are dispatched to state

  const { state, ...controller } = useModel()
  const { onClick, onKeyDown, onFocus } = controller

  const renderEntry = React.useCallback(({ index, measureRef }) => {
    // Handle 'overshooting':
    if (index >= state.entries.length) return null
    const entry = state.entries[index]

    return (
      <MemoizedCard
        key={entry.id}
        {...entry}
        ref={measureRef}
        selected={state.selected.includes(entry.id)}
        editing={state.editing}
        onClick={onClick}
      />
    )
  }, [state, onClick])

  return (
    <div className="e3de-sidebar"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={onClick(null)}
    >
      <ScopeSwitcher/>
      <FilterInput onFocus={onFocus}/>
      <LazyList
        count={state.entries.length}
        scroll={state.scroll}
        focusIndex={state.focusIndex}
        renderEntry={renderEntry}
      />
    </div>
  )
}
