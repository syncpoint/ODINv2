import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { Entries } from './selection'
import { initialState } from './list-state'
import { cmdOrCtrl } from '../platform'


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
  entries: (state, { entries }) => {
    // Don't update when entries are deep equal to previous state.
    if (isEqual(state.entries, entries)) return state
    const ids = entries.map(R.prop('id'))
    const selected = (state.selected || []).filter(id => ids.includes(id))

    return {
      ...state,
      entries,
      selected,
      scroll: 'auto'
    }
  },

  /**
   * Focus entry with given id.
   */
  select: (state, { id }) => {
    if (!id) return state

    const selected = Entries.index(state.entries, id) !== -1
      ? [id]
      : []

    return {
      ...state,
      selected,
      scroll: 'smooth'
    }
  },

  /** Select clicked entry. */
  click: (state, { id }) => ({
    ...state,
    selected: [id]
  }),

  'keydown/ArrowDown': (state, { metaKey, ctrlKey }) => {
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.
    if (!state.entries.length) return initialState

    const current = Entries.focusIndex(state)
    if (current === Entries.length(state) - 1) return state

    const selected = [Entries.id(state.entries, current + 1)]

    return {
      ...state,
      selected,
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { metaKey, ctrlKey }) => {
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state // not handled here.
    if (!state.entries.length) return initialState

    const current = Entries.focusIndex(state) === -1
      ? Entries.length(state)
      : Entries.focusIndex(state)

    if (current === 0) return state // BOL

    const selected = [Entries.id(state.entries, current - 1)]

    return {
      ...state,
      selected,
      scroll: 'auto'
    }
  },

  'keydown/Home': state => {
    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    const current = Entries.focusIndex(state)
    if (current === -1) return state // no selection
    if (current === -1 || current === 0) return state // BOL

    return {
      ...state,
      selected: [R.head(state.entries).id],
      scroll: 'auto'
    }
  },

  'keydown/End': state => {
    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    const current = Entries.focusIndex(state)

    // Return same state (reference) when we are already at the bottom.
    if (current === -1) return state // no selection
    if (current === Entries.length(state) - 1) return state // BOL

    return {
      ...state,
      selected: [R.last(state.entries).id],
      scroll: 'auto'
    }
  }
}
