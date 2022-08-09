import * as R from 'ramda'
import isEqual from 'react-fast-compare'

const Selection = {}
export { Selection }

Selection.empty = selected => !selected || !selected.length
Selection.equals = (a, b) => isEqual([...a].sort(), [...b].sort())
Selection.includes = (selected, id) => selected.includes(id)
Selection.selected = (state, index) => Selection.includes(state.selected, state.entries[index].id)
Selection.remove = (selected, id) => selected.filter(x => x !== id)
Selection.append = (selected, id) => [...selected, id]

Selection.toggle = (state, id) =>
  id
    ? Selection.includes(state.selected, id)
      ? Selection.remove(state.selected, id)
      : Selection.append(state.selected, id)
    : state.selected

/**
 * succ :: state -> index -> index
 * Find (downwards) next element which is not selected.
 */
Selection.succ = (state, currentIndex) =>
  currentIndex >= state.entries.length - 1
    ? -1
    : Selection.selected(state, currentIndex + 1)
      ? Selection.succ(state, currentIndex + 1)
      : currentIndex + 1

/**
 * pred :: state -> index -> index
 * Find (upwards) next element which is not selected.
 */
Selection.pred = (state, currentIndex) =>
  currentIndex <= 0
    ? -1
    : Selection.selected(state, currentIndex - 1)
      ? Selection.pred(state, currentIndex - 1)
      : currentIndex - 1

/**
 * Range of indexes which includes index of focused entry.
 */
Selection.focusRange = state => {
  if (Selection.empty(state.selected)) return []

  const indexes = state.selected
    .map(id => Entries.index(state.entries, id))
    .sort((a, b) => a - b)

  const ranges = R.groupWith((a, b) => a + 1 === b, indexes)
  const focused = range => range.includes(Entries.index(state.entries, R.last(state.selected)))
  return ranges.find(focused)
}

const Entries = {}
export { Entries }

Entries.empty = entries => !entries || !entries.length
Entries.length = state => state.entries.length
Entries.id = (entries, index) => entries[index].id
Entries.index = (entries, id) => entries.findIndex(entry => entry.id === id)

/**
 * Index of last selected entry (if any), else -1.
 */
Entries.focusIndex = (entries, selected) =>
  Selection.empty(selected)
    ? -1
    : Entries.index(entries, R.last(selected))

