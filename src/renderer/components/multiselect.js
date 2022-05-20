import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { cmdOrCtrl } from '../platform'
import { Selection, Entries } from './selection'


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

    const ids = entries.map(R.prop('id'))
    const selected = (state.selected || []).filter(id => ids.includes(id))

    return {
      ...state,
      entries,
      selected
    }
  },

  /** */
  click: (state, { id, shiftKey, metaKey, ctrlKey }) => {

    const shiftSelection = () => {
      const current = Entries.focusIndex(state)
      const next = Entries.index(state.entries, id)
      const range = Selection.focusRange(state)

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
      const shrinkSelection = () => {
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
        : shrinkSelection()
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

    const current = Entries.focusIndex(state)
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
      const range = Selection.focusRange(state)
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

    const current = Entries.focusIndex(state) === -1
      ? Entries.length(state)
      : Entries.focusIndex(state)

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
      const range = Selection.focusRange(state)
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

    const current = Entries.focusIndex(state)
    if (current === -1) return state
    else if (current === 0) return state

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
    if (current === -1) return state
    else if (current === Entries.length(state) - 1) return state

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
    const current = Entries.focusIndex(state)
    if (current === -1) return state

    const editId = state.entries[current].id
    return { ...state, editId }
  },

  /**
   * Toggle editing.
   */
  'keydown/Enter': state => {
    const current = Entries.focusIndex(state)
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
