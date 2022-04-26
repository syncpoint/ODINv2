import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { toggleSelection, indexOf, firstId, lastId, focusIndex } from './selection'
import { cmdOrCtrl } from '../platform'
import { Selection } from '../Selection'

/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection follows focus.
 *
 * Reference: macOS Finder
 */
export const multiselect = {

  /**
   *
   */
  entries: (state, { entries }) => {
    // Don't update when entries are deep equal to previous state.
    if (isEqual(state.entries, entries)) {
      return state
    }

    // Reset selection whenever entry list is updated.
    const selected = []

    return {
      ...state,
      entries,
      selected
    }
  },

  /** */
  click: (state, { id, metaKey, ctrlKey }) => {

    const selected = cmdOrCtrl({ metaKey, ctrlKey })
      ? [...state.selected, id]
      : [id]

    return {
      ...state,
      selected: R.uniq(selected),
      scroll: 'auto'
    }
  },

  /**
   * Sync selection with state.
   */
  selection: (state, { selected }) => {
    if (Selection.isEqual(state.selected, selected)) return state

    return {
      ...state,
      selected,
      scroll: 'none'
    }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey, ctrlKey }) => {
    // Navigation 'forward/open' not handled here:
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state

    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) return state

    const currentIndex = focusIndex(state)
    const incr = currentIndex < state.entries.length - 1 ? 1 : 0
    const selectedIndex = currentIndex + incr

    const selected = shiftKey
      ? [...state.selected, state.entries[selectedIndex].id]
      : [state.entries[selectedIndex].id]

    return {
      ...state,
      selected: R.uniq(selected),
      editId: null,
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey, ctrlKey }) => {
    // Navigation 'forward/open' not handled here:
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state

    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) return state

    const currentIndex = focusIndex(state) === -1
      ? state.entries.length
      : focusIndex(state)

    const decr = currentIndex > 0 ? 1 : 0
    const selectedIndex = currentIndex - decr

    const selected = shiftKey
      ? [...state.selected, state.entries[selectedIndex].id]
      : [state.entries[selectedIndex].id]

    return {
      ...state,
      selected: R.uniq(selected),
      editId: null,
      scroll: 'auto'
    }
  },

  'keydown/Home': state => {

    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) return state

    const currentIndex = focusIndex(state)

    // Return same state (reference) when we are already at the top.
    if (currentIndex === 0) return state

    const selected = [R.head(state.entries).id]
    return { ...state, selected, scroll: 'auto' }
  },

  'keydown/End': state => {
    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) return state

    const currentIndex = focusIndex(state)

    // Return same state (reference) when we are already at the bottom.
    if (currentIndex === state.entries.length - 1) return state

    const selected = [R.last(state.entries).id]
    return { ...state, selected, scroll: 'auto' }
  },

  'keydown/a': (state, { metaKey, ctrlKey }) => {
    if (!cmdOrCtrl({ metaKey, ctrlKey })) return state

    const selected = [...state.entries.map(entry => entry.id)]

    return { 
      ...state, 
      selected, 
      scroll: 'none' 
    }
  },

  /**
   * Cancel edit; reset selection (if any).
   */
  'keydown/Escape': state => {
    // Cancel edit has precedence over selection.
    if (state.editId) return { ...state, editId: null }

    // Deselect all.
    if (!state.selected || !state.selected.length) return state
    return { ...state, selected: [], scroll: 'none' }
  },

  /**
   * Start editing of focused option.
   */
  'keydown/F2': state => {
    const currentIndex = focusIndex(state)
    if (currentIndex === -1) return state

    const editId = state.entries[currentIndex].id
    return { ...state, editId }
  },

  /**
   * Toggle editing.
   */
  'keydown/Enter': state => {
    const currentIndex = focusIndex(state)
    if (currentIndex === -1) return state

    const editId = state.entries[currentIndex].id    
    if (editId === state.editId) return { ...state, editId: null }
    else return { ...state, editId }
  },

  /**
   * Cancel ongoing edit (if any).
   */
  blur: state => {
    if (state.editId) return { ...state, editId: null }
    return state
  }
}
