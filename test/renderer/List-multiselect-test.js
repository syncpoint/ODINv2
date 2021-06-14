import assert from 'assert'
import { multiselect } from '../../src/renderer/components/list/multiselect'

describe.only('multiselect', function () {

  it('snapshot - replace options, clear focus and selected', function () {
    const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1 }
    const actual = multiselect.snapshot(state, { ids: ['a', 'b', 'c'] })
    const expected = { ids: ['a', 'b', 'c'], selected: [], focusIndex: -1 }
    assert.deepStrictEqual(actual, expected)
  })

  describe('click', function () {
    it('focus option', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: 1 }
      const actual = multiselect.click(state, { index: 0 })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - select option, update focus', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: -1 }
      const actual = multiselect.click(state, { index: 0, metaKey: true })
      const expected = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - deselect option, update focus', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: -1 }
      const actual = multiselect.click(state, { index: 0, metaKey: true })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('focus', function () {
    it('retain focus', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: 0 }
      const actual = multiselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('idempotent (list is empty)', function () {
      const state = { ids: [], selected: [], focusIndex: -1 }
      const actual = multiselect.focus(state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option (no selection)', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: -1 }
      const actual = multiselect.focus(state)
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0 }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus first selected option', function () {
      const state = { ids: ['x', 'y', 'z'], selected: ['z', 'y'], focusIndex: -1 }
      const actual = multiselect.focus(state)

      // first selected option (by index) -> 'y'
      const focusIndex = 1
      const expected = { ids: ['x', 'y', 'z'], selected: ['z', 'y'], focusIndex }
      assert.deepStrictEqual(actual, expected)
    })
  })


  describe('keydown/ArrowDown', function () {
    it('focus first option', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus next option, clear selection', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 1, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (EOL)', function () {
      const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 1, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - idempotent', function () {
      const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1, scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/ArrowUp', function () {
    it('focus first option', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous option, clear selection', function () {
      const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (BOL)', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'smooth' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - idempotent', function () {
      const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1, scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowUp'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/Home', function () {
    it('idempotent (empty list)', function () {
      const state = { ids: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('idempotent (no focus)', function () {
      const state = { ids: ['x'], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option, retain selection', function () {
      const state = { ids: ['x', 'y'], selected: ['y'], focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      const expected = { ids: ['x', 'y'], selected: ['y'], focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/End', function () {
    it('idempotent (empty list)', function () {
      const state = { ids: [], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('idempotent (no focus)', function () {
      const state = { ids: ['x'], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus last option, retain selection', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      const expected = { ids: ['x', 'y'], selected: ['x'], focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/a', function () {
    it('idempotent (no meta)', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: false })
      assert.deepStrictEqual(actual, state)
    })

    it('select all options, focus last option', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/a'](state, { metaKey: true })
      const expected = { ids: ['x', 'y'], selected: ['x', 'y'], focusIndex: 1, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/(space) ', function () {
    it('idempotent (no focus)', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      assert.deepStrictEqual(actual, state)
    })

    it('toggle selection -> selected', function () {
      const state = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      const expected = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })

    it('toggle selection -> deselected', function () {
      const state = { ids: ['x', 'y'], selected: ['x'], focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ '](state)
      const expected = { ids: ['x', 'y'], selected: [], focusIndex: 0, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })
  })
})
