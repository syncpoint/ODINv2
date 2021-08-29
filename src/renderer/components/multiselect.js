import * as R from 'ramda'
import { toggleSelection, indexOf, firstId, lastId } from './selection'
import { initialState } from './list-state'
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
   *
   */
  entries: (state, { entries }) => {

    // 438fe36c-5778-4684-be38-b7d76e50e34b - filter does not change selection

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
      scroll: 'auto'
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

    // TODO: check if focusId still exists
    // TODO: no focus: optionally focus first entry

    return { ...state, selected }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey, ctrlKey }) => {
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.

    const index = indexOf(state.entries, state.focusId)
    const focusIndex = Math.min(state.entries.length - 1, index + 1)
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

  'keydown/ArrowUp': (state, { shiftKey, metaKey, ctrlKey }) => {
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.

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
    const focusId = firstId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, scroll: 'auto' }
  },

  'keydown/End': state => {
    if (!state.focusId) return state
    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, scroll: 'auto' }
  },

  'keydown/a': (state, { metaKey, ctrlKey }) => {
    if (!cmdOrCtrl({ metaKey, ctrlKey })) return state
    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    const selected = [...state.entries.map(entry => entry.id)]
    return { ...state, selected, focusId, focusIndex, scroll: 'none' }
  },

  'keydown/ ': state => {
    if (state.focusId === null) return state
    const selected = toggleSelection(state.selected, state.focusId)
    return { ...state, selected }
  },

  'keydown/Escape': (state) => {
    return { ...state, selected: [], scroll: 'none' }
  }
}
