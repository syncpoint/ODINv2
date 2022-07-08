import assert from 'assert'
import { multiselect } from './multiselect'

describe('multiselect', function () {

  describe('entries', function () {

    it('noop (deep equal)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, scroll: 'none' }
      // entries: new reference with same values
      const actual = multiselect.entries(state, { entries: [...entries] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (empty list)', function () {
      // special case of: noop (deep equal)
      const state = { entries: [] }
      const actual = multiselect.entries(state, { entries: [] })
      assert(actual === state) // reference equal, same state
    })

    it('update entries (no selection)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        focusIndex: -1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('update entries and focus', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'] }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        selected: ['y'],
        focusIndex: 1,
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
        scroll: 'auto'
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
        scroll: 'auto'
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
        scroll: 'auto'
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
        scroll: 'auto'
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
        scroll: 'auto'
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
        scroll: 'auto'
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
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    // not supported, yet
    it.skip('shrink range (upward)', function () {
      const state = { entries, selected: ['x', 'y', 'z'] }
      const actual = multiselect.click(state, { id: 'y', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['x', 'y'], // FIXME: selection is empty
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    // not supported, yet
    it.skip('shrink range (downward)', function () {
      const state = { entries, selected: ['z', 'y', 'x'] }
      const actual = multiselect.click(state, { id: 'y', shiftKey: true })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }, { id: 'z' }],
        selected: ['z', 'y'], // FIXME: selection is empty
        scroll: 'auto'
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
        editId: null,
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
        editId: null,
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
        editId: null,
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
        editId: null,
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
