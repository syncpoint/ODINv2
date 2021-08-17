import * as R from 'ramda'
import { toggleSelection, indexOf, firstId, lastId } from './selection'

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

  /** Focus clicked entry, optionally selecting it. */
  click: (state, { id, shiftKey, metaKey }) => {
    const selected = metaKey
      ? toggleSelection(state.selected, id)
      : []

    return {
      ...state,
      focusId: id,
      focusIndex: indexOf(state.entries, id),
      selected
    }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.

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

  'keydown/ArrowUp': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.

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

  'keydown/a': (state, { metaKey }) => {
    if (!metaKey) return state
    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    const selected = [...state.entries.map(entry => entry.id)]
    return { ...state, selected, focusId, focusIndex, scroll: 'none' }
  },

  'keydown/ ': state => {
    if (state.focusId === null) return state
    const selected = toggleSelection(state.selected, state.focusId)
    return { ...state, selected }
  }
}
