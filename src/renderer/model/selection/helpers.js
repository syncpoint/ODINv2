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


const Q = {} // queries
Q.ids = entries => entries.map(R.prop('id'))
Q.id = (index, entries) => entries[index].id
Q.index = (id, entries) => R.findIndex(R.propEq('id', id), entries)
Q.clamp = (index, entries) => Math.min(Math.max(index, 0), entries.length - 1)
Q.includes = (xs, x) => xs.includes(x)
Q.concat = (xs, ys) => xs.concat(ys)
Q.append = (xs, x) => xs.includes(x) ? xs : [...xs, x]


const P = {} // predicates
P.isEqualSorted = (a, b) => isEqual([...a].sort(), [...b].sort())
P.hasSameEntries = entries => state => isEqual(entries, state.entries)
P.isFocusRequested = state => state.focusId

P.staleSelection = (entries, state) => {
  const removed = R.difference(Q.ids(state.entries), Q.ids(entries))
  return R.intersection(state.selected, removed)
}

/**
 * Selection is stale if it contains ids no longer
 * available in entries, but were in previous state.
 */
P.hasStaleSelection = entries => state => {
  return !isEqual(P.staleSelection(entries, state), state.selected)
}

P.hasEntry = (id, entries) => Q.index(id, entries) !== -1
P.hasRequestedEntry = entries => state => P.hasEntry(state.focusId, entries)
P.hasFocus = state => state.focusIndex !== -1
P.isFocusSelected = state => Q.includes(state.selected, Q.ids(state.entries)[state.focusIndex])

const O = {} // operations
O.noop = R.identity
O.updateEntries = entries => state => ({ ...state, entries })

/**
 * Don't mess up global selection.
 * Only remove ids from those entry which are
 * no longer available in entries. Keep ids
 * which never existed as entries in previous state.
 */
O.purgeSelection = entries => state => {
  const stale = P.staleSelection(entries, state)
  return ({ ...state, selected: R.difference(state.selected, stale) })
}

O.select = ids => state => ({ ...state, selected: Q.concat(state.selected, ids) })

O.focusRequested = entries => state => {
  const focusIndex = Q.index(state.focusId, entries)
  const selected = [state.focusId] // sole selection
  // TODO: clear focusId
  const { focusId, ...next } = state
  return ({ ...next, focusIndex, selected, scroll: 'auto' })
}

O.moveFocus = entries => state => {
  if (state.focusIndex === -1) return state
  else {
    const previousId = Q.id(state.focusIndex, state.entries)
    const focusIndex = P.hasEntry(previousId, entries)
      ? Q.index(previousId, entries)
      : Q.clamp(state.focusIndex, entries)

    const nextId = Q.id(focusIndex, entries)
    const selected = Q.append(state.selected, nextId)
    return { ...state, focusIndex, selected, scroll: 'auto' }
  }
}

export const B = {} // building blocks

/**
 * Case A: focus was requested and entry is now available.
 * Case B.1: no entry was focused - keep it that way
 * Case B.2: focused entry is gone - keep/move index up as necessary, incl. -1 (parking position)
 * Case B.3: entries were added before index - move index down with previously focused entry
 * Case B.4: entries were added after index - keep index with previously focused entry
 */
B.updateFocus = entries => R.ifElse(
  R.allPass([P.isFocusRequested, P.hasRequestedEntry(entries)]),
  O.focusRequested(entries),
  O.moveFocus(entries)
)

/**
 * Update entries and move focus as necessary.
 * Note: Request to focus certain entry is repected.
 */
B.updateEntries = entries => R.ifElse(
  P.hasSameEntries(entries),
  O.noop,
  O.updateEntries(entries)
)

/**
 * Remove all keys from selection no longer available in entries.
 * Relevant for deleted entries, but not relevant for filtering.
 * because selection is cleared prior filtering.
 * Note: focusIndex remains untouched.
 */
B.purgeSelection = entries => R.ifElse(
  P.hasStaleSelection(entries),
  O.purgeSelection(entries),
  O.noop
)
