import assert from 'assert'
import { singleselect } from '../../../src/renderer/components/singleselect'
import { initialState } from '../../../src/renderer/components/list-state'

describe('singleselect', function () {

  describe('entries', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('reset to initial state (empty list)', function () {
      const state = { entries, selected: ['x'], focusIndex: 0, focusId: 'x' }
      const actual = singleselect.entries(state, { entries: [] })
      assert.deepStrictEqual(actual, initialState)
    })

    it('focus/select candidate (scroll/smooth)', function () {
      const state = { entries, selected: ['y'], focusIndex: 1, focusId: 'y' }
      const actual = singleselect.entries(state, { entries: [{ id: 'y' }, { id: 'z' }], candidateId: 'z' })
      const expected = {
        entries: [{ id: 'y' }, { id: 'z' }],
        focusId: 'z',
        focusIndex: 1,
        selected: ['z'],
        scroll: 'smooth'
      }

      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus/selection (adjust index)', function () {
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

    it('focus same index (entry removed)', function () {
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
  })

  describe('keydown/ArrowUp', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
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
