import * as R from 'ramda'
import { toggleSelection } from './selection'

/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection does not follow focus:
 *   If an option would automatically be selected with focus,
 *   this would be reflected immediately in the entire application.
 *   Specifically, in feature list, feature properties would pop up each and
 *   every time, a feature gets focus. This is something we do not want.
 */
export const multiselect = {
  snapshot: (state, { ids }) => {
    return { ...state, ids, selected: [], focusIndex: -1 }
  },

  /** Focus clicked entry, optionally selecting it. */
  click: (state, { index, shiftKey, metaKey }) => {
    const selected = metaKey
      ? toggleSelection(state.selected, state.ids[index])
      : []

    return { ...state, focusIndex: index, selected }
  },

  /**
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
  focus: state => {
    if (state.focusIndex !== -1) return state
    if (!state.ids.length) return state

    const selectedIndexes = state.selected.map(id => state.ids.indexOf(id)).sort()
    const focusIndex = selectedIndexes.length
      ? selectedIndexes[0]
      : 0

    return { ...state, focusIndex }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.

    const focusIndex = Math.min(state.ids.length - 1, state.focusIndex + 1)
    const current = state.ids[state.focusIndex]
    const next = state.ids[focusIndex]

    const selected = shiftKey
      ? state.selected.includes(next)
        ? R.uniq([...toggleSelection(state.selected, current), next])
        : R.uniq([...state.selected, next, current])
      : []

    return { ...state, focusIndex, selected, scroll: 'smooth' }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey }) => {
    if (metaKey) return state // not handled here.

    const focusIndex = Math.max(0, state.focusIndex - 1)
    const current = state.ids[state.focusIndex]
    const next = state.ids[focusIndex]

    const selected = shiftKey
      ? state.selected.includes(next)
        ? R.uniq([...toggleSelection(state.selected, current), next])
        : R.uniq([...state.selected, next, current])
      : []

    return { ...state, focusIndex, selected, scroll: 'smooth' }
  },

  'keydown/Home': state => {
    if (state.focusIndex === -1) return state
    const focusIndex = state.ids.length ? 0 : -1
    return { ...state, focusIndex, scroll: 'auto' }
  },

  'keydown/End': state => {
    if (state.focusIndex === -1) return state
    const focusIndex = state.ids.length - 1
    return { ...state, focusIndex, scroll: 'auto' }
  },

  'keydown/a': (state, { metaKey }) => {
    if (!metaKey) return state

    return {
      ...state,
      selected: [...state.ids],
      focusIndex: state.ids.length - 1,
      scroll: 'none'
    }
  },

  'keydown/ ': state => {
    if (state.focusIndex === -1) return state
    const current = state.ids[state.focusIndex]
    const selected = toggleSelection(state.selected, current)
    return { ...state, selected }
  }
}
