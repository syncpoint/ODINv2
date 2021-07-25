import assert from 'assert'
import { Undo } from '../../src/renderer/Undo'

const command = (queue, name, inverse = false) => {
  return {
    apply: () => queue.push(`${name} - ${inverse ? 'inverse' : 'forward'}`),
    inverse: () => command(queue, name, !inverse)
  }
}

describe('Undo', function () {

  it('canUndo', function () {
    const undo = new Undo()
    assert.strictEqual(undo.canUndo(), false)
  })

  it('canRedo', function () {
    const undo = new Undo()
    assert.strictEqual(undo.canRedo(), false)
  })

  it('apply', async function () {
    const undo = new Undo()
    const queue = []
    await undo.apply(command(queue, 'A'))
    assert.strictEqual(undo.canUndo(), true, 'can undo')
    assert.strictEqual(undo.canRedo(), false, 'cannot redo')
    assert.deepStrictEqual(queue, ['A - forward'])
  })

  it('undo', async function () {
    const undo = new Undo()
    const queue = []
    await undo.apply(command(queue, 'A'))
    await undo.undo()
    assert.strictEqual(undo.canUndo(), false, 'cannot undo')
    assert.strictEqual(undo.canRedo(), true, 'can redo')
    assert.deepStrictEqual(queue, ['A - forward', 'A - inverse'])
  })

  it('redo', async function () {
    const undo = new Undo()
    const queue = []
    await undo.apply(command(queue, 'A'))
    assert.strictEqual(undo.canUndo(), true, 'can undo')
    await undo.undo()
    assert.strictEqual(undo.canRedo(), true, 'can redo')
    await undo.redo()
    assert.deepStrictEqual(queue, ['A - forward', 'A - inverse', 'A - forward'])
  })

  it('undo/redo', async function () {
    const undo = new Undo()
    const queue = []
    await undo.apply(command(queue, 'A')) // 'A - forward'
    await undo.apply(command(queue, 'B')) // 'B - forward'
    await undo.undo() // 'B - inverse'
    await undo.apply(command(queue, 'C')) // 'C - forward'
    await undo.redo() // 'B - forward'
    await undo.undo() // 'B - inverse'
    await undo.undo() // 'C - inverse'
    await undo.undo() // 'A - inverse'

    assert.strictEqual(undo.canUndo(), false, 'cannot undo')
    assert.strictEqual(undo.canRedo(), true, 'can redo')
    assert.deepStrictEqual(queue, [
      'A - forward',
      'B - forward',
      'B - inverse',
      'C - forward',
      'B - forward',
      'B - inverse',
      'C - inverse',
      'A - inverse'
    ])
  })
})
