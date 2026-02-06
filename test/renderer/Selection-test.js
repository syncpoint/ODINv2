import assert from 'assert'
import { Selection } from '../../src/renderer/Selection'
import { ERR_INVALID_ARG } from '../../src/shared/error'

describe('Selection', function () {

  it('#isEmpty', function () {
    const selection = new Selection()
    assert(selection.isEmpty())
  })

  it('#isSelected', function () {
    const selection = new Selection()
    selection.select(['a'])
    assert(selection.isSelected('a'))
    assert(!selection.isSelected('x'))
  })

  it('#selected', function () {
    const selection = new Selection()
    selection.select(['x', 'a:1', 'a:2'])
    assert.deepStrictEqual(selection.selected(), ['x', 'a:1', 'a:2'])
    assert.deepStrictEqual(selection.selected(entry => entry.startsWith('a:')), ['a:1', 'a:2'])
  })

  it('#select - noop', function () {
    const selection = new Selection()
    selection.select()
    selection.select([])
  })

  it('#select - invalid argument; array expected', function () {
    const selection = new Selection()
    try {
      selection.select('abc')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#select - invalid argument; array expected', function () {
    const selection = new Selection()
    try {
      selection.select('abc')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#select - invalid argument; string elements expected', function () {
    const selection = new Selection()
    try {
      selection.select([4711])
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('select', function (done) {
    const selection = new Selection()
    selection.select(['x'])
    selection.on('selection', ({ selected, deselected }) => {
      assert.deepStrictEqual(selected, ['a', 'b'])
      assert.deepStrictEqual(deselected, [])
      ;['x', 'a', 'b'].forEach(entry => assert(selection.isSelected(entry)))
      done()
    })

    selection.select(['a', 'b', 'a']) // dups are filtered
  })

  it('#deselect - noop', function () {
    const selection = new Selection()
    selection.deselect([])
  })

  it('#deselect - invalid argument; array expected', function () {
    const selection = new Selection()
    try {
      selection.deselect('a')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#deselect - invalid argument; string element expected', function () {
    const selection = new Selection()
    try {
      selection.deselect([4711])
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#deselect', function (done) {
    const selection = new Selection()
    selection.select(['x', 'a', 'b'])
    selection.on('selection', ({ selected, deselected }) => {
      assert.deepStrictEqual(selected, [])
      assert.deepStrictEqual(deselected, ['a', 'b'])
      done()
    })

    selection.deselect(['a', 'b'])
    assert(selection.isSelected('x'))
  })

  it('#set - invalid argument; array expected', function () {
    const selection = new Selection()
    try {
      selection.set('a')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#set - invalid argument; string element expected', function () {
    const selection = new Selection()
    try {
      selection.set([4711])
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.code, ERR_INVALID_ARG)
    }
  })

  it('#set', function (done) {
    const selection = new Selection()
    selection.select(['x', 'a', 'b'])
    selection.on('selection', ({ selected, deselected }) => {
      assert.deepStrictEqual(selected, ['c'])
      assert.deepStrictEqual(deselected, ['x', 'a'])
      assert.deepStrictEqual(selection.selected(), ['b', 'c'])
      done()
    })

    selection.set(['b', 'c', 'b']) // dups are filtered
  })
})
