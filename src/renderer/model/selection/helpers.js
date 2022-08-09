import * as R from 'ramda'
import isEqual from 'react-fast-compare'


export const Q = {} // queries
Q.ids = R.pluck('id')
Q.id = (index, entries) => entries[index].id
Q.comparator = R.comparator(R.lt)
Q.index = (id, entries) => R.findIndex(R.propEq('id', id), entries)
Q.clamp = (index, entries) => Math.min(Math.max(index, 0), entries.length - 1)
Q.append = (xs, x) => xs.includes(x) ? xs : [...xs, x]
Q.isEmpty = xs => xs.length === 0
Q.isEqual = R.curry((xs, ys) => xs.length === ys.length && xs.length === R.intersection(xs, ys).length)

export const S = {} // selection
S.isEmpty = R.compose(Q.isEmpty, R.prop('selected'))
S.isNotEmpty = R.complement(S.isEmpty)
S.isEqual = selected => R.compose(Q.isEqual(selected), R.prop('selected'))
S.update = R.curry((selected, state) => ({ ...state, selected }))
S.isDisjunct = state => Q.isEmpty(R.intersection(state.selected, Q.ids(state.entries)))
S.isEmptyOrDisjunct = R.anyPass([S.isEmpty, S.isDisjunct])
S.hasSelection = state => state.selected.length > 0

const E = {} // entries
E.isEmpty = R.compose(Q.isEmpty, R.prop('entries'))
E.isNotEmpty = R.complement(E.isEmpty)

export const P = {} // predicates
P.hasSameEntries = entries => state => isEqual(entries, state.entries)
P.isFocusRequested = state => state.focusId
P.removedEntries = (entries, state) => R.difference(Q.ids(state.entries), Q.ids(entries))
P.outdatedSelection = (entries, state) => R.intersection(state.selected, P.removedEntries(entries, state))
P.hasOutdatedSelection = entries => state => P.outdatedSelection(entries, state).length
P.hasEntry = (id, entries) => Q.index(id, entries) !== -1
P.hasRequestedEntry = entries => state => P.hasEntry(state.focusId, entries)
P.hasFocus = state => state.focusIndex !== -1
P.hasSelection = state => state.selected.length > 0
P.requestFocus = id => state => ({ ...state, focusId: id })

const O = {} // operations
O.updateEntries = entries => state => ({ ...state, entries })
O.purgeSelection = entries => state => ({ ...state, selected: R.difference(state.selected, P.outdatedSelection(entries, state)) })

/**
 * Note: Clear focus implicitly with selection.
 */
O.clearSelection = state => ({ ...state, selected: [], focusIndex: -1 })
O.clearFocus = state => ({ ...state, focusIndex: -1, scroll: 'none' })

O.focusRequested = entries => state => {
  const focusIndex = Q.index(state.focusId, entries)
  const selected = [state.focusId] // sole selection
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

    if (focusIndex === -1) return state
    else if (focusIndex === state.focusIndex) return state
    else {
      const nextId = Q.id(focusIndex, entries)
      const selected = Q.append(state.selected, nextId)
      return { ...state, focusIndex, selected, scroll: 'auto' }
    }
  }
}

O.focusHead = state => {
  const focusIndex = 0
  const selected = [Q.id(focusIndex, state.entries)]
  return { ...state, focusIndex, selected, scroll: 'auto' }
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
B.updateEntries = entries => R.unless(
  P.hasSameEntries(entries),
  O.updateEntries(entries)
)

/**
 * Remove all keys from selection no longer available in entries.
 * Relevant for deleted entries, but not relevant for filtering.
 * because selection is cleared prior filtering.
 * Note: focusIndex remains untouched.
 */
B.purgeSelection = entries => R.when(
  P.hasOutdatedSelection(entries),
  O.purgeSelection(entries)
)

B.clearSelection = R.when(
  P.hasSelection,
  O.clearSelection
)

B.updateSelection = selected => R.unless(
  S.isEqual(selected),
  S.update(selected)
)

/**
 * Clear focus whenever selection only contains
 * ids of entries not contained in state or
 * selection is empty.
 */
B.adjustFocus = R.when(
  R.allPass([P.hasFocus, S.isEmptyOrDisjunct]),
  O.clearFocus
)

B.focusHead = R.when(
  R.allPass([R.complement(P.hasFocus), E.isNotEmpty, S.isEmpty]),
  O.focusHead
)
