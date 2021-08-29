import assert from 'assert'
import { singleselect } from '../../../src/renderer/components/singleselect'
import { initialState } from '../../../src/renderer/components/list-state'

describe('singleselect', function () {

  describe('entries', function () {

    it('reset focus and selection (empty list)', function () {
      // Note: This is pretty different from multiselect.
      const entries = [{ id: 'x' }, { id: 'y' }] // we will remove all entries
      const state = { entries, selected: ['x'], focusIndex: 0, focusId: 'x' }
      const actual = singleselect.entries(state, { entries: [] })
      const expected = {
        entries: [],
        focusIndex: -1,
        focusId: null,
        selected: [],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus and selection (adjust index)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }] // we will remove all entries
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.entries(state, { entries: [{ id: 'x' }, { id: 'w' }, { id: 'y' }] })
      const expected = {
        entries: [{ id: 'x' }, { id: 'w' }, { id: 'y' }],
        focusId: 'y',
        focusIndex: 2,
        selected: ['y'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous index (entry removed)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }] // we will remove 'x'
      const state = { entries, selected: ['x'], focusIndex: 0, focusId: 'x' }
      const actual = singleselect.entries(state, { entries: [{ id: 'y' }] })
      const expected = {
        entries: [{ id: 'y' }],
        focusId: 'y',
        focusIndex: 0,
        selected: ['y'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous index (entry removed)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }] // we will remove all entries
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = {
        entries: [{ id: 'x' }],
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('focus', function () {

    it('focus and select candidate (scroll/smooth)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.focus(state, { focusId: 'x' })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }],
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'smooth'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('reset focus and selection (candidate does not exist)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.focus(state, { focusId: 'z' })
      const expected = {
        entries: [{ id: 'x' }, { id: 'y' }],
        focusId: null,
        focusIndex: -1,
        selected: [],
        scroll: 'smooth'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('noop (undefined candidate)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.focus(state, { focusId: null })
      assert(actual === state)
    })
  })

  describe('click', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('focus option', function () {
      const state = { entries, selected: [], focusIndex: 1 }
      const actual = singleselect.click(state, { id: 'x' })
      const expected = {
        entries,
        focusId: 'x',
        focusIndex: 0,
        selected: ['x']
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/ArrowDown', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('focus next option', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        focusId: 'y',
        focusIndex: 1,
        selected: ['y'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = {
        entries,
        focusId: 'y',
        focusIndex: 1,
        selected: ['y'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
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

    it('focus previous option', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = {
        entries,
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      const actual = singleselect['keydown/ArrowUp'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })

    it('noop (empty list)', function () {
      const actual = singleselect['keydown/ArrowUp'](initialState, {})
      assert.deepStrictEqual(actual, initialState)
    })

    it('noop (no focus)', function () {
      const state = { entries, selected: [], focusId: null, focusIndex: -1, scroll: 'smooth' }
      const actual = singleselect['keydown/ArrowUp'](state, {})
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/Home', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no focus)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      const expected = {
        entries,
        focusId: 'x',
        focusIndex: 0,
        selected: ['x'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/End', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no focus)', function () {
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus last option', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      const expected = {
        entries,
        focusId: 'y',
        focusIndex: 1,
        selected: ['y'],
        scroll: 'auto'
      }

      assert.deepStrictEqual(actual, expected)
    })
  })
})
