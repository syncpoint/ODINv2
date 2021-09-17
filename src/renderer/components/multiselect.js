import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { toggleSelection, indexOf, firstId, lastId } from './selection'
import { cmdOrCtrl } from '../platform'

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
   * 438fe36c-5778-4684-be38-b7d76e50e34b - filter does not change selection
   */
  entries: (state, { entries }) => {

    // Don't update when entries are deep equal to previous state.
    if (isEqual(state.entries, entries)) return state

    const focusIndex = state.focusId
      ? indexOf(entries, state.focusId)
      : -1

    const focusId = focusIndex !== -1
      ? entries[focusIndex].id
      : null

    return {
      ...state,
      entries,
      focusIndex,
      focusId,
      scroll: 'none'
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

  selection: (state, { event }) => {

    // Add selected, remove deselected:
    const selected = state.selected.concat(event.selected)
      .filter(id => !event.deselected.includes(id))

    // Return same state (reference) when selection didn't change:
    if (isEqual(state.selected, selected)) return state

    // TODO: 5ddb2139-daf4-4ca1-902d-3149e4b191cd - multiselect/selection: improve behavior

    return {
      ...state,
      selected,
      scroll: 'none' // don't scroll with changed focus (for now)
    }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey, ctrlKey }) => {
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.
    if (!state.entries || !state.entries.length) return state

    if (state.focusIndex === state.entries.length - 1) {
      // Clear selection, if any.
      if (state.selected.length) return { ...state, selected: [], scroll: 'auto' }
      else return state
    }

    const index = indexOf(state.entries, state.focusId)
    const focusIndex = Math.min(state.entries.length - 1, index + 1)
    const focusId = state.entries[focusIndex].id

    // FIXME: SHIFT/ArrowDown after deleting entry
    const selected = shiftKey
      ? state.selected.includes(focusId)
        ? R.uniq([...toggleSelection(state.selected, state.focusId), focusId])
        : R.uniq([...state.selected, focusId, state.focusId])
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
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.
    if (!state.entries || !state.entries.length) return state

    if (state.focusIndex === 0) {
      // Clear selection, if any.
      if (state.selected.length) return { ...state, selected: [], scroll: 'auto' }
      else return state
    }

    const index = indexOf(state.entries, state.focusId)
    const focusIndex = Math.max(0, index - 1)
    const focusId = state.entries[focusIndex].id

    const selected = shiftKey
      ? state.selected.includes(focusId)
        ? R.uniq([...toggleSelection(state.selected, state.focusId), focusId])
        : R.uniq([...state.selected, focusId, state.focusId])
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
    if (state.focusIndex === 0) return state

    const focusId = firstId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, scroll: 'auto' }
  },

  'keydown/End': state => {
    if (!state.focusId) return state

    // Return same state (reference) when we are already at the end.
    if (state.focusIndex === state.entries.length - 1) return state

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
   * Reset selection (if any).
   */
  'keydown/Escape': (state) => {
    if (!state.selected || !state.selected.length) return state
    return { ...state, selected: [], scroll: 'none' }
  }
}
