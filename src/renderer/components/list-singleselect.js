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
   * Apply string to filter list entries.
   */
  filter: (state, { filter }) => ({ ...state, filter }),

  /** Focus and select clicked entry. */
  click: (state, { id, shiftKey, metaKey }) => ({
    ...state,
    focusId: id,
    focusIndex: indexOf(state.entries, id),
    selected: [id]
  }),

  /**
   * When a single-select listbox receives focus:
   *
   *   - If none of the options are selected before the listbox receives focus,
   *     the first option receives focus. Optionally, the first option may be
   *     automatically selected.
   *   - If an option is selected before the listbox receives focus,
   *     focus is set on the selected option.
   */
  focus: state => {
    if (state.focusId) return state
    if (!state.entries.length) return state

    // Focus first selected entry or first entry if no selection:
    const selectedIndexes = state.selected
      .map(id => indexOf(state.entries, id))
      .sort()

    const focusIndex = selectedIndexes.length ? selectedIndexes[0] : 0
    const focusId = state.entries[focusIndex].id
    return { ...state, focusIndex, focusId, selected: [focusId] }
  },


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
