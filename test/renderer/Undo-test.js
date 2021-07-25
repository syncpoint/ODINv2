import assert from 'assert'
import Undo from '../../src/renderer/Undo'

describe.skip('Undo', function () {

  it('Undo#canUndo', function () {
    const undo = new Undo()
    assert.strictEqual(undo.canUndo(), false)
  })
})
