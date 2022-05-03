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
 * @deprecated
 */
export const isFocusBOL = state =>
  state.entries &&
  state.entries.length &&
  state.focusIndex === 0

/**
 * @deprecated
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

export const isSelected = (state, index) => 
  state.selected.includes(state.entries[index].id)

export const nextIndex = (state, currentIndex) => {
  if (currentIndex >= state.entries.length - 1) return -1
  else if (isSelected(state, currentIndex + 1)) return nextIndex(state, currentIndex + 1)
  else return currentIndex + 1
}

export const previousIndex = (state, currentIndex) => {
  if (currentIndex <= 0) return -1
  else if (isSelected(state, currentIndex - 1)) return previousIndex(state, currentIndex - 1)
  else return currentIndex - 1
}
