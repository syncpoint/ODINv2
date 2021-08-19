import { indexOf, firstId, lastId } from './selection'
import { initialState } from './list-state'

/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection follows focus.
 *
 * When a single-select listbox receives focus:
 *
 *   - If none of the options are selected before the listbox receives focus,
 *     the first option receives focus. Optionally, the first option may be
 *     automatically selected.
 *   - If an option is selected before the listbox receives focus,
 *     focus is set on the selected option.
 */
export const singleselect = {

  /**
   *
   */
  entries: (state, { entries, candidateId }) => {

    if (!entries.length) {
      // Back to square one.
      return initialState
    }

    if (candidateId) {
      return {
        ...state,
        entries,
        focusId: candidateId,
        focusIndex: indexOf(entries, candidateId),
        selected: [candidateId],
        scroll: 'smooth'
      }
    }

    // Check if focused entry is still available.
    const index = indexOf(entries, state.focusId)

    const focusIndex = index === -1
      ? Math.min(entries.length - 1, state.focusIndex)
      : index

    const focusId = focusIndex !== -1
      ? entries[focusIndex].id
      : null

    return {
      ...state,
      entries,
      focusIndex,
      focusId,
      selected: focusId !== null ? [focusId] : [],
      scroll: 'auto'
    }
  },

  /** Focus and select clicked entry. */
  click: (state, { id, shiftKey, metaKey }) => ({
    ...state,
    focusId: id,
    focusIndex: indexOf(state.entries, id),
    selected: [id]
  }),

  'keydown/ArrowDown': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.
    if (!state.entries.length) return initialState

    // focusId = null => -1
    const currentIndex = indexOf(state.entries, state.focusId)
    const focusIndex = Math.min(state.entries.length - 1, currentIndex + 1)
    const focusId = focusIndex !== -1
      ? state.entries[focusIndex].id
      : null

    return {
      ...state,
      focusId,
      focusIndex,
      selected: focusId ? [focusId] : [],
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.
    if (!state.entries.length) return initialState
    if (!state.focusId) return state

    const currentIndex = indexOf(state.entries, state.focusId)
    const focusIndex = Math.max(0, currentIndex - 1)
    const focusId = focusIndex !== -1
      ? state.entries[focusIndex].id
      : null

    return {
      ...state,
      focusId,
      focusIndex,
      selected: focusId ? [focusId] : [],
      scroll: 'auto'
    }
  },

  'keydown/Home': state => {
    if (!state.focusId) return state
    const focusId = firstId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, selected: [focusId], scroll: 'auto' }
  },

  'keydown/End': state => {
    if (!state.focusId) return state
    const focusId = lastId(state.entries)
    const focusIndex = indexOf(state.entries, focusId)
    return { ...state, focusId, focusIndex, selected: [focusId], scroll: 'auto' }
  }
}
