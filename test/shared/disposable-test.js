import assert from 'assert'
import * as R from 'ramda'
import { Disposable } from '../../src/shared/disposable'

describe('Disposable', function () {

  it('initially is not disposed', function () {
    const x = Disposable.of()
    assert.strictEqual(x.disposed(), false)
  })

  it('is disposed after disposing', function () {
    const x = Disposable.of()
    x.dispose()
    assert.strictEqual(x.disposed(), true)
  })

  it('calls disposables in insert order', function () {
    let expected = 0
    const x = Disposable.of()
    R.range(0, 10).forEach(index => {
      x.add(() => {
        assert.strictEqual(index, expected)
        expected += 1
      })
    })

    x.dispose()
    assert.strictEqual(expected, 10)
  })

  it('calls identical disposables only once', function () {
    let expected = 0
    const a = () => (expected += 1)

    // Add same disposable several times:
    const x = Disposable.of()
    R.range(0, 10).forEach(() => x.add(a))
    x.dispose()

    // It should be called only once.
    assert.strictEqual(expected, 1)
  })

  it('does not call removed disposables', function () {
    let expected = false
    const x = Disposable.of()
    const a = () => (expected = true)
    const b = () => assert.strictEqual(expected, false)
    x.add(a)
    x.add(b)
    x.remove(a)
    x.dispose()
  })

  it('disposes event listeners (on)', function () {
    let expected = 0
    const handler = () => {}
    const target = {
      on: () => {},
      off: (event, fn) => {
        if (event === 'event' && fn === handler) expected += 1
      }
    }

    const x = Disposable.of()
    x.on(target, 'event', handler)
    x.dispose()

    assert.strictEqual(expected, 1)
  })

  it('disposes event listeners (addEventListener)', function () {
    let expected = 0
    const handler = () => {}
    const target = {
      addEventListener: () => {},
      removeEventListener: (event, fn) => {
        if (event === 'event' && fn === handler) expected += 1
      }
    }

    const x = Disposable.of()
    x.addEventListener(target, 'event', handler)
    x.dispose()

    assert.strictEqual(expected, 1)
  })
})
