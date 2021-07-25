import assert from 'assert'
import { multiselect } from '../../src/renderer/components/list/multiselect'

describe('List-multiselect', function () {

  it('filter', function () {
    const state = {}
    const actual = multiselect.filter(state, { filter: 'x' })
    const expected = { filter: 'x' }
    assert.deepStrictEqual(actual, expected)
  })

  describe('click', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus option', function () {
      const state = { entries, selected: [], focusIndex: 1 }
      const actual = multiselect.click(state, { id: 'x' })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - select option, update focus', function () {
      const state = { entries, selected: [], focusIndex: -1 }
      const actual = multiselect.click(state, { id: 'x', metaKey: true })
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - deselect option, update focus', function () {
      const state = { entries, selected: ['x'], focusIndex: -1 }
      const actual = multiselect.click(state, { id: 'x', metaKey: true })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('focus', function () {
    const entries = [['x', 0], ['y', 1], ['z', 2]]

    it('retain focus', function () {
      const state = { entries, selected: [], focusId: 'x', focusIndex: 0 }
      const actual = multiselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1 }
      const actual = multiselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option (no selection)', function () {
      const state = { entries, selected: [], focusIndex: -1 }
      const actual = multiselect.focus(state)
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus first selected option', function () {
      const state = { entries, selected: ['z', 'y'], focusIndex: -1 }
      const actual = multiselect.focus(state)

      // first selected option (by index) -> 'y'
      const expected = { entries, selected: ['z', 'y'], focusId: 'y', focusIndex: 1 }
      assert.deepStrictEqual(actual, expected)
    })
  })


  describe('keydown/ArrowDown', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus next option, clear selection', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (EOL)', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/ArrowUp', function () {
    const entries = [['x', 0], ['y', 1]]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous option, clear selection', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (BOL)', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowUp'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/Home', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no focus)', function () {
      const state = { entries: [['x'], 0], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option, retain selection', function () {
      const entries = [['x', 0], ['y', 1]]
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      const expected = { entries, selected: ['y'], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/End', function () {
    it('noop (empty list)', function () {
      const state = { entries: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('noop (no focus)', function () {
      const state = { entries: [['x'], 0], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus last option, retain selection', function () {
      const entries = [['x', 0], ['y', 1]]
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      const expected = { entries, selected: ['x'], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/a', function () {
    const entries = [['x', 0], ['y', 1]]

    it('noop (no meta)', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: false })
      assert.deepStrictEqual(actual, state)
    })

    it('select all options, focus last option', function () {
      const state = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: true })
      const expected = { entries, selected: ['x', 'y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/(space) ', function () {
    const entries = [['x', 0], ['y', 1]]

    it('noop (no focus)', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      assert.deepStrictEqual(actual, state)
    })

    it('toggle selection -> selected', function () {
      const state = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      const expected = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })

    it('toggle selection -> deselected', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })
  })
})
