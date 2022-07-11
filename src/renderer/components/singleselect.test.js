import assert from 'assert'
import { singleselect } from './singleselect'
import { initialState } from './list-state'

describe('singleselect', function () {

  describe('entries', function () {

    it('noop (empty list)', function () {
      const state = { entries: [] }
      const actual = singleselect.entries(state, { entries: [] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (deep equal)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries }
      // entries: new reference with same values
      const actual = singleselect.entries(state, { entries: [...entries] })
      assert(actual === state) // reference equal, same state
    })

    it('retain selection (adjust index)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }] // we will remove all entries
      const state = { entries, selected: ['y'] }
      const actual = singleselect.entries(state, { entries: [{ id: 'x' }, { id: 'w' }, { id: 'y' }] })
      const expected = {
        entries: [{ id: 'x' }, { id: 'w' }, { id: 'y' }],
        selected: ['y'],
        focusIndex: 2,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('select', function () {

    it('select candidate (scroll/smooth)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'] }
      const actual = singleselect.select(state, { id: 'x' })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }],
        selected: ['x'],
        focusIndex: 0,
        scroll: 'smooth'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('reset selection (candidate does not exist)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'] }
      const actual = singleselect.select(state, { id: 'z' })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }],
        selected: [],
        focusIndex: -1,
        scroll: 'smooth'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('noop (undefined candidate)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'] }
      const actual = singleselect.select(state, { id: null })
      assert(actual === state)
    })
  })

  describe('click', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('select option', function () {
      const state = { entries, selected: [] }
      const actual = singleselect.click(state, { id: 'x' })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/ArrowDown', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('select first option', function () {
      const state = { entries, selected: [], scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
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
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain selection', function () {
      const state = { entries, selected: ['y'], focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], scroll: 'smooth' }
      const actual = singleselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })

    it('noop (empty list)', function () {
      const actual = singleselect['keydown/ArrowDown'](initialState, {})
      assert.deepStrictEqual(actual, initialState)
    })
  })

  describe('keydown/ArrowUp', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('select previous option', function () {
      const state = { entries, selected: ['y'], scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain selection', function () {
      const state = { entries, selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        selected: ['x'],
        focusIndex: 0,
        scroll: 'none'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], scroll: 'smooth' }
      const actual = singleselect['keydown/ArrowUp'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })

    it('noop (empty list)', function () {
      const actual = singleselect['keydown/ArrowUp'](initialState, {})
      assert.deepStrictEqual(actual, initialState)
    })
  })

  describe('keydown/Home', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no selection)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('select first option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
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
      const actual = singleselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no selection)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('select last option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['x'], scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      const expected = {
        entries,
        selected: ['y'],
        focusIndex: 1,
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })
})
