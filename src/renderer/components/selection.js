import * as R from 'ramda'

/**
 *
 */
export const toggleSelection = (selected, id) => id
  ? selected.includes(id)
    ? selected.filter(x => x !== id)
    : [...selected, id]
  : selected


/**
 *
 */
export const indexOf = (entries, id) => entries.findIndex(entry => entry.id === id)


/**
 *
 */
export const firstId = entries => entries.length
  ? entries[0].id
  : null


/**
 *
 */
export const lastId = entries => entries.length
  ? entries[entries.length - 1].id
  : null


/**
 *
 */
export const isFocusBOL = state =>
  state.entries &&
  state.entries.length &&
  state.focusIndex === 0

/**
 *
 */
export const isFocusEOL = state =>
  state.entries &&
  state.entries.length &&
  state.focusIndex === state.entries.length - 1

/**
 * Index of last selected entry (if any), else -1.
 */
export const focusIndex = state =>
  (state.selected && state.selected.length)
    ? indexOf(state.entries, R.last(state.selected))
    : -1
