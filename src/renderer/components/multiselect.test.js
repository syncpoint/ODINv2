import assert from 'assert'
import { multiselect } from './multiselect'

describe('multiselect', function () {

  // TODO: add missing test cases (entries)
  describe('entries', function () {

    it('noop (empty list)', function () {
      const state = { entries: [] }
      const actual = multiselect.entries(state, { entries: [] })
      assert(actual === state) // reference equal, same state
    })

    it('noop (deep equal)', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries }
      // entries: new reference with same values
      const actual = multiselect.entries(state, { entries: [...entries] })
      assert(actual === state) // reference equal, same state
    })
  })

  describe('click', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

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

  describe('keydown/ArrowDown', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus next option, clear selection', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (EOL)', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('meta - noop', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'smooth' }
      const actual = multiselect['keydown/ArrowDown'](state, { metaKey: true })
      assert.deepStrictEqual(actual, state)
    })
  })

  describe('keydown/ArrowUp', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

    it('focus first option', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('focus previous option, clear selection', function () {
      const state = { entries, selected: ['y'], focusId: 'y', focusIndex: 1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('retain focus, clear selection (BOL)', function () {
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'x', focusIndex: 0, scroll: 'auto' }
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
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/Home'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus first option, retain selection', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
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
      const entries = [{ id: 'x' }]
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      assert.deepStrictEqual(actual, state)
    })

    it('focus last option, retain selection', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, selected: ['x'], focusId: 'x', focusIndex: 0, scroll: 'none' }
      const actual = multiselect['keydown/End'](state)
      const expected = { entries, selected: ['x'], focusId: 'y', focusIndex: 1, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('keydown/a', function () {
    const entries = [{ id: 'x' }, { id: 'y' }]

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
    const entries = [{ id: 'x' }, { id: 'y' }]

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
