import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { toggleSelection, indexOf, firstId, lastId, isFocusBOL, isFocusEOL } from './selection'
import { cmdOrCtrl } from '../platform'
import { Selection } from '../Selection'

/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection does not follow focus.
 *
 * When a multi-select listbox receives focus:
 *
 *   - If none of the options are selected before the listbox receives
 *     focus, focus is set on the first option and there is no
 *     automatic change in the selection state.
 *   - If one or more options are selected before the listbox receives
 *     focus, focus is set on the first option in the list that is selected.
 *
 * Reference: https://www.w3.org/TR/wai-aria-practices-1.1/#listbox_kbd_interaction
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

    const focusIndex = state.focusId
      ? indexOf(entries, state.focusId)
      : -1

    const focusId = focusIndex !== -1
      ? entries[focusIndex].id
      : null

    // Only scroll when index of focused option has changed:
    const scroll = focusIndex === -1
      ? 'none'
      : focusIndex === state.focusIndex
        ? 'none'
        : 'auto'

    return {
      ...state,
      entries,
      focusIndex,
      focusId,
      scroll
    }
  },

  /**
   * Focus entry with given id.
   */
  focus: (state, { focusId: id }) => {
    if (!id) return state
    const focusIndex = indexOf(state.entries, id)

    const focusId = focusIndex !== -1
      ? state.entries[focusIndex].id
      : null

    return {
      ...state,
      focusIndex,
      focusId,
      selected: focusId ? [focusId] : [],
      scroll: 'smooth'
    }
  },

  /** Focus clicked entry, optionally selecting it. */
  click: (state, { id, metaKey, ctrlKey }) => {

    // Don't touch state when clicked on already focused entry:
    if (!cmdOrCtrl({ metaKey, ctrlKey }) && id === state.focusId) return state

    const selected = cmdOrCtrl({ metaKey, ctrlKey })
      ? toggleSelection(state.selected, id)
      : []

    return {
      ...state,
      focusId: id,
      focusIndex: indexOf(state.entries, id),
      selected
    }
  },

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
    if (cmdOrCtrl({ metaKey, ctrlKey })) {
      return state
    }

    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) {
      return state
    }

    if (isFocusEOL(state)) {
      if (shiftKey) return state // NOOP: shift key is pressed
      else if (!state.selected.length) return state // NOOP: selection already clear
      else return { ...state, selected: [], scroll: 'auto' } // clear selection
    }

    const focusIndex = state.focusId
      ? Math.min(state.entries.length - 1, indexOf(state.entries, state.focusId) + 1)
      : 0

    const focusId = state.entries[focusIndex].id

    const selected = shiftKey
      ? state.selected.includes(focusId)
        ? R.uniq([...toggleSelection(state.selected, state.focusId), focusId])
        // previous focusId might be null
        : R.uniq([...state.selected, focusId, ...(state.focusId ? [state.focusId] : [])])
      : []

    return {
      ...state,
      focusId,
      focusIndex,
      selected,
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey, ctrlKey }) => {

    // Navigation 'back' not handled here:
    if (cmdOrCtrl({ metaKey, ctrlKey })) {
      return state
    }

    // Nothing to do if list is empty:
    if (!state.entries || !state.entries.length) {
      return state
    }

    if (isFocusBOL(state)) {
      if (shiftKey) return state // NOOP: shift key is pressed
      else if (!state.selected.length) return state // NOOP: selection already clear
      else return { ...state, selected: [], scroll: 'auto' } // clear selection
    }

    const focusIndex = state.focusId
      ? Math.max(0, indexOf(state.entries, state.focusId) - 1)
      : state.entries.length - 1

    const focusId = state.entries[focusIndex].id

    const selected = shiftKey
      ? state.selected.includes(focusId)
        ? R.uniq([...toggleSelection(state.selected, state.focusId), focusId])
        // previous focusId might be null
        : R.uniq([...state.selected, focusId, ...(state.focusId ? [state.focusId] : [])])
      : []

    return {
      ...state,
      focusId,
      focusIndex,
      selected,
      scroll: 'auto'
    }
  },

  'keydown/Home': state => {
    if (!state.focusId) return state

    // Return same state (reference) when we are already at the top.
    if (isFocusBOL(state)) return state

    const focusId = firstId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, scroll: 'auto' }
  },

  'keydown/End': state => {
    if (!state.focusId) return state

    // Return same state (reference) when we are already at the end.
    if (isFocusEOL(state)) return state

    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, scroll: 'auto' }
  },

  'keydown/a': (state, { metaKey, ctrlKey }) => {
    if (!cmdOrCtrl({ metaKey, ctrlKey })) return state
    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    const selected = [...state.entries.map(entry => entry.id)]

    // Note: Select/all should not scroll to focused entry.
    return { ...state, selected, focusId, focusIndex, scroll: 'none' }
  },

  'keydown/ ': state => {
    if (state.focusId === null) return state
    const selected = toggleSelection(state.selected, state.focusId)
    return { ...state, selected }
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
    if (!state.focusId) return state
    return { ...state, editId: state.focusId }
  },

  /**
   * Toggle editing.
   */
  'keydown/Enter': state => {
    if (state.editId) {
      if (state.focusId === state.editId) return { ...state, editId: null }
      else return { ...state, editId: state.focusId }
    } else if (state.focusId) return { ...state, editId: state.focusId }
    else return state
  },

  /**
   * Cancel ongoing edit (if any).
   */
  blur: state => {
    if (state.editId) return { ...state, editId: null }
    return state
  }
}
