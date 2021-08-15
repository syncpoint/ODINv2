import assert from 'assert'
import { singleselect } from '../../src/renderer/components/list-singleselect'

describe('singleselect', function () {

  it('filter', function () {
    const state = {}
    const actual = singleselect.filter(state, { filter: 'x' })
    const expected = { filter: 'x' }
    assert.deepStrictEqual(actual, expected)
  })

  describe('click', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus option', function () {
      const state = { entries, selected: [], focusIndex: 1 }
      const actual = singleselect.click(state, { id: 'x' })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('focus', function () {
    const entries = [['x', 0], ['y', 1], ['z', 2]]

    it('retain focus', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0 }
      const actual = singleselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1 }
      const actual = singleselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option (no selection)', function () {
      const state = { entries, selected: [], focusIndex: -1 }
      const actual = singleselect.focus(state)
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus selected option', function () {
      const state = { entries, selected: ['z'], focusIndex: -1 }
      const actual = singleselect.focus(state)
      const expected = { entries, selected: ['z'], focusId: 'z', focusIndex: 2 }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/ArrowDown', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus next option', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      const actual = singleselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/ArrowUp', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous option', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
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
      const state = { entries: [['x'], 0], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option', function () {
      const entries = [['x', 0], ['y', 1]]
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = singleselect['keydown/Home'](state)
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
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
      const state = { entries: [['x'], 0], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus last option', function () {
      const entries = [['x', 0], ['y', 1]]
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = singleselect['keydown/End'](state)
      const expected = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })
})
