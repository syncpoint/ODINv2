import assert from 'assert'
import { multiselect } from './multiselect'

describe('multiselect', function () {
  describe('clear', function () {

    it('noop', function () {
      const state = { entries: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect.clear(state)
      assert(actual === state) // reference equal, same state
    })

    it('selection', function () {
      const state = { entries: [{ id: 'x' }], selected: ['x'], focusIndex: -1, scroll: 'none' }
      const actual = multiselect.clear(state)
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        selected: [],
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('focus', function () {
      const state = { entries: [{ id: 'x' }], selected: [], focusIndex: 0, scroll: 'none' }
      const actual = multiselect.clear(state)
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        selected: [],
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('all', function () {
      const state = { entries: [{ id: 'x' }], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect.clear(state)
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        selected: [],
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('entries', function () {

    it('noop (deep equal)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: -1, selected: [], scroll: 'none' }
      // entries: new reference with same values
      const actual = multiselect.entries(state, { entries: [...entries] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (empty list)', function () {
      // special case of: noop (deep equal)
      const state = { entries: [], focusIndex: -1, selected: [] }
      const actual = multiselect.entries(state, { entries: [] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (same entries, scroll: none)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: 1, selected: ['x', 'y'], scroll: 'none' }
      const actual = multiselect.entries(state, { entries })
      assert(actual === state) // reference equal, same state
    })

    it('update entries (no selection)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: -1, selected: [] }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        selected: []
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('update entries (keep global selection)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: -1, selected: ['a', 'b'] }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        selected: ['a', 'b']
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('remove entries - keep focus', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: 0, selected: ['x'], scroll: 'none' }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        selected: ['x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('remove entries - move focus up', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusIndex: 1, selected: ['y'] }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        selected: ['x'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('remove last entry - clear focus', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, focusIndex: 0, selected: ['x'] }
      const actual = multiselect.entries(state, { entries: [] })
      const expected = {
        entries: [],
        selected: [],
        focusIndex: -1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('add entries - move focus down', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 0, selected: ['y'] }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }] })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('add entries - focus requested (not available)', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 1, selected: ['z'], focusId: 'a', scroll: 'none' }
      const actual = multiselect.entries(state, { entries: [{ id: 'y' }, { id: 'z' }, { id: 'b' }] })
      const expected = {
        entries: [{ id: 'y' }, { id: 'z' }, { id: 'b' }],
        selected: ['z'],
        focusIndex: 1,
        focusId: 'a',
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('add entries - focus requested (available)', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 1, selected: ['z'], focusId: 'a' }
      const actual = multiselect.entries(state, { entries: [{ id: 'y' }, { id: 'z' }, { id: 'a' }] })
      const expected = {
        entries: [{ id: 'y' }, { id: 'z' }, { id: 'a' }],
        selected: ['a'],
        focusIndex: 2,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('selection', function () {
    it('noop (same)', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 1, selected: ['y', 'z'], scroll: 'auto' }
      const actual = multiselect.selection(state, { selected: ['y', 'z'] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (reverse)', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 1, selected: ['y', 'z'], scroll: 'auto' }
      const actual = multiselect.selection(state, { selected: ['z', 'y'] })
      assert(actual === state) // reference equal, same state
    })

    it('clear selection', function () {
      const entries = [{ id: 'y' }, { id: 'z' }]
      const state = { entries, focusIndex: 1, selected: ['y', 'z'], scroll: 'auto' }
      const actual = multiselect.selection(state, { selected: [] })
      const expected = {
        entries,
        selected: [],
        focusIndex: -1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('selection ∩ entries = ∅', function () {
      const entries = [{ id: 'a' }, { id: 'b' }]
      const state = { entries, focusIndex: 1, selected: ['b'], scroll: 'auto' }
      const actual = multiselect.selection(state, { selected: ['x'] })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: -1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('focus', function () {

    it('request focus', function () {
      const entries = [{ id: 'a' }, { id: 'b' }]
      const state = { entries, focusIndex: 1, selected: ['b'], scroll: 'none' }
      const actual = multiselect.focus(state, { id: 'x' })
      const expected = {
        entries,
        selected: ['b'],
        focusIndex: 1,
        scroll: 'none',
        focusId: 'x'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('noop (has focus)', function () {
      const entries = [{ id: 'a' }, { id: 'b' }]
      const state = { entries, focusIndex: 1, selected: ['b'], scroll: 'none' }
      const actual = multiselect.focus(state, {})
      assert(actual === state) // reference equal, same state
    })

    it('noop (no entries)', function () {
      const entries = []
      const state = { entries, focusIndex: -1, selected: [], scroll: 'none' }
      const actual = multiselect.focus(state, {})
      assert(actual === state) // reference equal, same state
    })

    it('noop (selection not empty)', function () {
      const entries = [{ id: 'a' }, { id: 'b' }]
      const state = { entries, focusIndex: -1, selected: ['x'], scroll: 'none' }
      const actual = multiselect.focus(state, {})
      assert(actual === state) // reference equal, same state
    })

    it('select first', function () {
      const entries = [{ id: 'a' }, { id: 'b' }]
      const state = { entries, focusIndex: -1, selected: [], scroll: 'none' }
      const actual = multiselect.focus(state, {})
      const expected = {
        entries,
        selected: ['a'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('click', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('select option (no selection)', function () {
      const state = { entries, selected: [] }
      const actual = multiselect.click(state, { id: 'x' })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('select option (replace selection)', function () {
      const state = { entries, selected: ['y'] }
      const actual = multiselect.click(state, { id: 'x' })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - toggle selection (deselected)', function () {
      const state = { entries, selected: [] }
      const actual = multiselect.click(state, { id: 'x', metaKey: true })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - toggle selection (selected)', function () {
      const state = { entries, selected: ['x'] }
      const actual = multiselect.click(state, { id: 'x', metaKey: true })
      const expected = {
        entries,
        selected: [],
        focusIndex: -1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - toggle/add selection', function () {
      const state = { entries, selected: ['y'] }
      const actual = multiselect.click(state, { id: 'x', metaKey: true })
      const expected = {
        entries,
        selected: ['y', 'x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('shift/click', function () {
    const entries = [{ id: 'x' }, { id: 'y' }, { id: 'z' }]

    it('extent range (downward)', function () {
      const state = { entries, selected: ['x'] }
      const actual = multiselect.click(state, { id: 'z', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['x', 'y', 'z'],
        focusIndex: 2,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('extent range (upward)', function () {
      const state = { entries, selected: ['z'] }
      const actual = multiselect.click(state, { id: 'x', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['z', 'y', 'x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    // not supported, yet
    it.skip('shrink range (upward)', function () {
      const state = { entries, selected: ['x', 'y', 'z'] }
      const actual = multiselect.click(state, { id: 'y', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['x', 'y'],
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    // not supported, yet
    it.skip('shrink range (downward)', function () {
      const state = { entries, selected: ['z', 'y', 'x'] }
      const actual = multiselect.click(state, { id: 'y', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['z', 'y'],
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/ArrowDown', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('noop (empty list)', function () {
      const state = { entries: [] }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('noop (EOL)', function () {
      const state = { entries, selected: ['y'] }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('select first option', function () {
      const state = { entries, selected: [], scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('select next option', function () {
      const state = { entries, selected: ['x'], scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/ArrowUp', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('noop (empty list)', function () {
      const state = { entries: [] }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('noop (BOL)', function () {
      const state = { entries, selected: ['x'] }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('select last option', function () {
      const state = { entries, selected: [], scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('select previous option', function () {
      const state = { entries, selected: ['y'], scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowUp'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/Home', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no selection)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('select first option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/End', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no selection)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('select last option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['x'], scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/a', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('noop (no meta)', function () {
      const state = { entries, selected: ['x'], scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: false })
      assert.deepStrictEqual(actual, state)
    })

    it('select all options', function () {
      const state = { entries, selected: [], scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: true })
      const expected = {
        entries,
        selected: ['x', 'y'],
        focusIndex: 1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })
})
