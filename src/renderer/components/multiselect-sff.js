import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { cmdOrCtrl } from '../platform'

const Selection = {}

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
Selection.range = state => {
  if (Selection.empty(state.selected)) return []

  const indexes = state.selected
    .map(id => Entries.index(state.entries, id))
    .sort((a, b) => a - b)

  const ranges = R.groupWith((a, b) => a + 1 === b, indexes)
  const focused = range => range.includes(Entries.index(state.entries, R.last(state.selected)))
  return ranges.find(focused)
}

const Entries = {}

Entries.empty = entries => !entries || !entries.length
Entries.length = state => state.entries.length
Entries.id = (entries, index) => entries[index].id
Entries.index = (entries, id) => entries.findIndex(entry => entry.id === id)

/**
 * Index of last selected entry (if any), else -1.
 */
 Entries.focused = state => 
  Selection.empty(state.selected)
    ? -1
    : Entries.index(state.entries, R.last(state.selected))


/**
 * WAI ARIA Reference (3.14 Listbox):
 * https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox
 */

/**
 * Selection follows focus.
 *
 * Reference: macOS Finder
 */
export const multiselect = {

  /**
   *
   */
  entries: (state, { entries }) => {
    // Don't update when entries are deep equal to previous state.
    if (isEqual(state.entries, entries)) return state
    return { ...state, entries }
  },

  /** */
  click: (state, { id, shiftKey, metaKey, ctrlKey }) => {

    const shiftSelection = () => {
      const current = Entries.focused(state)
      const next = Entries.index(state.entries, id)
      const range = Selection.range(state)

      const leading = range.indexOf(current) === 0
      const trailing = range.indexOf(current) === range.length - 1
      const before = next < R.head(range)
      const after = next > R.last(range)

      const extent = 
        (trailing && after) ||
        (leading && before)

      // Extent focused range downwards/upwards.
      const extentSelection = () => {
        const extension = 
          current < next
            ? R.range(current + 1, next + 1)
            : R.range(next, current).reverse()

        const selected = extension.map(index => state.entries[index].id)
        return [...state.selected, ...selected]
      }

      // Deselect focused range and select new entries depending on
      // various (4) conditions.
      const invertSelection = () => {
        const ids = range.map(index => state.entries[index].id)
        const remaining = state.selected.filter(id => !ids.includes(id))

        // Cases explained:
        // A: current focus is last in range
        // B: current focus is first in range
        // C: neither A nor B: current focus is before clicked element
        // D: neither A nor B: current focus is after clicked element

        // Note: We have to reverse order when new focused element 
        // is before start of selection (cases A and D).
        const inversion = 
          trailing
            ? R.range(next, R.head(range) + 1).reverse() // A
            : leading
              ? R.range(R.last(range), next + 1) // B
              : current < next
                ? R.range(current, next + 1) // C
                : R.range(next, current + 1).reverse() // D

        const selected = inversion.map(index => state.entries[index].id)
        return [...remaining, ...selected]
      }
      
      return extent
        ? extentSelection()
        : invertSelection()
    }

    const selected = cmdOrCtrl({ metaKey, ctrlKey })
      ? Selection.toggle(state, id)
      : shiftKey
        ? shiftSelection()
        : [id]

    return {
      ...state,
      selected,
      scroll: 'auto'
    }
  },

  /**
   * Sync selection with state.
   */
  selection: (state, { selected }) => {
    if (Selection.equals(state.selected, selected)) return state

    return {
      ...state,
      selected,
      scroll: 'none'
    }
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey, ctrlKey }) => {
    // Navigation 'forward/open' not handled here:
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state

    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    const current = Entries.focused(state)
    if (current === Entries.length(state) - 1) return state // EOL

    const id = index => Entries.id(state.entries, index)

    const shrink = () => {
      // Remove current and re-add/focus next:
      const selected = state.selected
        .filter(x => x !== id(current))
        .filter(x => x !== id(current + 1))
      return [...selected, id(current + 1)]
    }

    const extent = () => {
      const succ = Selection.succ(state, current)
      return succ === -1
        ? state.selected
        : Selection.append(state.selected, id(succ))
    }

    const shiftSelection = () => {
      const range = Selection.range(state)
      const leading = range.indexOf(current) === 0 && range.length > 1
      return leading ? shrink() : extent()
    }

    const selected = shiftKey
      ? shiftSelection()
      : [Entries.id(state.entries, current + 1)]

    return {
      ...state,
      selected,
      editId: null,
      scroll: 'auto'
    }
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey, ctrlKey }) => {
    // Navigation 'forward/open' not handled here:
    if (cmdOrCtrl({ metaKey, ctrlKey })) return state

    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    const current = Entries.focused(state) === -1
      ? Entries.length(state)
      : Entries.focused(state)

    if (current === 0) return state // BOL

    const id = index => Entries.id(state.entries, index)

    const shrink = () => {
      // Remove current and re-add/focus next:
      const selected = state.selected
        .filter(x => x !== id(current))
        .filter(x => x !== id(current - 1))
      return [...selected, id(current - 1)]
    }

    const extent = () => {
      const pred = Selection.pred(state, current)
      return pred === -1
        ? state.selected
        : Selection.append(state.selected, id(pred))
    }

    const shiftSelection = () => {
      const range = Selection.range(state)
      const trailing = range.indexOf(current) === range.length - 1 && range.length > 1
      return trailing ? shrink() : extent()
    }

    const selected = shiftKey
      ? shiftSelection()
      : [id(current - 1)]

    return {
      ...state,
      selected,
      editId: null,
      scroll: 'auto'
    }
  },

  'keydown/Home': state => {
    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    // Return same state (reference) when we are already at beginning of list (BOL).
    if (Entries.focused(state) === 0) return state

    return { 
      ...state, 
      selected: [R.head(state.entries).id], 
      scroll: 'auto' 
    }
  },

  'keydown/End': state => {
    // Nothing to do if list is empty:
    if (Entries.empty(state.entries)) return state

    // Return same state (reference) when we are already at the bottom.
    if (Entries.focused(state) === Entries.length(state) - 1) return state

    return { 
      ...state, 
      selected: [R.last(state.entries).id], 
      scroll: 'auto' 
    }
  },

  'keydown/a': (state, { metaKey, ctrlKey }) => {
    if (!cmdOrCtrl({ metaKey, ctrlKey })) return state

    return {
      ...state,
      selected: [...state.entries.map(entry => entry.id)],
      scroll: 'none'
    }
  },

  /**
   * Cancel edit; reset selection (if any).
   */
  'keydown/Escape': state => {
    // Cancel edit has precedence over selection.
    if (state.editId) return { ...state, editId: null }

    // Deselect all.
    if (Selection.empty(state.selected)) return state
    return { ...state, selected: [], scroll: 'none' }
  },

  /**
   * Start editing of focused option.
   */
  'keydown/F2': state => {
    const current = Entries.focused(state)
    if (current === -1) return state

    const editId = state.entries[current].id
    return { ...state, editId }
  },

  /**
   * Toggle editing.
   */
  'keydown/Enter': state => {
    const current = Entries.focused(state)
    if (current === -1) return state

    const editId = state.entries[current].id
    if (editId === state.editId) return { ...state, editId: null }
    else return { ...state, editId }
  },

  /**
   * Cancel ongoing edit (if any).
   */
  blur: state => {
    if (state.editId) return { ...state, editId: null }
    return state
  }
}
