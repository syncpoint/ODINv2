import { indexOf, firstId, lastId } from './selection'

/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection follows focus.
 */
export const singleselect = {

  /**
   *
   */
  entries: (state, { entries, candidateId }) => {
    if (!entries.length) {
      return { ...state, entries, focusIndex: -1, focusId: null, selected: [] }
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
      selected: [focusId],
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

    const index = indexOf(state.entries, state.focusId)
    const focusIndex = Math.min(state.entries.length - 1, index + 1)
    const focusId = state.entries[focusIndex].id

    return {
      ...state,
      focusId,
      focusIndex,
      selected: [focusId],
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.

    const index = indexOf(state.entries, state.focusId)
    const focusIndex = Math.max(0, index - 1)
    const focusId = state.entries[focusIndex].id

    return {
      ...state,
      focusId,
      focusIndex,
      selected: [focusId],
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
