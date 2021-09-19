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

    it('retain focus with updated index', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusId: 'y', focusIndex: 1 }
      const actual = multiselect.entries(state, { entries: [{ id: 'y' }] })
      const expected = { entries: [{ id: 'y' }], focusId: 'y', focusIndex: 0, scroll: 'auto' }
      assert.deepStrictEqual(actual, expected)
    })

    it('[0cf18440-d412-4e2c-8444-e1098980e562]', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusId: null, focusIndex: -1 }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = { entries: [{ id: 'x' }], focusId: null, focusIndex: -1, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
    })

    it('[b6d19139-6569-446c-a396-6a2d126dd23d]', function () {
      const entries = [{ id: 'x' }, { id: 'y' }]
      const state = { entries, focusId: 'y', focusIndex: 1 }
      const actual = multiselect.entries(state, { entries: [{ id: 'x' }] })
      const expected = { entries: [{ id: 'x' }], focusId: null, focusIndex: -1, scroll: 'none' }
      assert.deepStrictEqual(actual, expected)
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

    it('noop - (empty list)', function () {
      const state = { entries: [] }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('noop - (EOL, no selection)', function () {
      const state = { entries, focusId: 'y', focusIndex: 1, selected: [] }
      const actual = multiselect['keydown/ArrowDown'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('[bbfc4235-e68d-4135-bfe0-e9a535704de1]', function () {
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

    it('noop - (empty list)', function () {
      const state = { entries: [] }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('noop - (BOL, no selection)', function () {
      const state = { entries, focusId: 'x', focusIndex: 0, selected: [] }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      assert(actual === state) // reference equal, same state
    })

    it('[70ec2ff1-53c7-4bd6-a211-467dc9a3a345]', function () {
      const state = { entries, selected: [], focusIndex: -1, scroll: 'none' }
      const actual = multiselect['keydown/ArrowUp'](state, { shiftKey: false })
      const expected = { entries, selected: [], focusId: 'y', focusIndex: 1, scroll: 'auto' }
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
