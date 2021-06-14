import assert from 'assert'
import * as R from 'ramda'
import EventEmitter from '../../src/shared/emitter'
import { ERR_INVALID_ARG } from '../../src/shared/error'


describe('EventEmitter', function () {

  it('#emit - on (/w handler)', function () {
    const emitter = new EventEmitter()
    const acc = []
    emitter.on('event', event => acc.push(event.path))
    assert.strictEqual(emitter.emit('event'), true)
    assert.deepStrictEqual(acc, ['event'])
  })

  it('#emit - on (/w parameters)', function () {
    const emitter = new EventEmitter()
    const acc = []
    emitter.on('event/:id/:action', event => acc.push(event.path))
    assert.strictEqual(emitter.emit('event/4711/delete'), true)
    assert.strictEqual(emitter.emit('event/8829/update'), true)
    assert.deepStrictEqual(acc, ['event/4711/delete', 'event/8829/update'])
  })

  it('#emit - on (/w regex)', function () {
    const emitter = new EventEmitter()
    const acc = []
    const PATTERN = '[0-9a-f-]{36}'
    emitter.on(`event/:id(${PATTERN})`, event => acc.push(event.path))
    assert.strictEqual(emitter.emit('event/5daa8077-a2c2-42d2-aef6-5c95655f9732'), true)
    assert.strictEqual(emitter.emit('event/UNSUPPORTED-PATTERN'), false)
    assert.deepStrictEqual(acc, ['event/5daa8077-a2c2-42d2-aef6-5c95655f9732'])
  })

  it('#emit - on (/wo handler)', function () {
    const emitter = new EventEmitter()
    assert.strictEqual(emitter.emit('event'), false)
  })

  it('#emit - once', function () {
    const emitter = new EventEmitter()
    const acc = []
    emitter.once('event', event => acc.push(event.path))
    assert.strictEqual(emitter.emit('event'), true)
    assert.strictEqual(emitter.emit('event'), false)
    assert.deepStrictEqual(acc, ['event'])
  })

  it('#off - (/w handler)', function () {
    const emitter = new EventEmitter()
    const handler = () => {}
    emitter.on('event', handler)
    emitter.off('event', handler)
    assert.strictEqual(emitter.emit('event'), false)
  })

  it('#off - noop (/wo handler)', function () {
    const emitter = new EventEmitter()
    emitter.off('event', () => {})
  })

  const errorCode = fn => R.tryCatch(fn, err => err.code)()

  it('#off - invalid arg: pattern', function () {
    const emitter = new EventEmitter()
    const code = errorCode(() => emitter.off())
    assert.strictEqual(ERR_INVALID_ARG, code)
  })

  it('#off - invalid arg: handler (undefined)', function () {
    const emitter = new EventEmitter()
    const code = errorCode(() => emitter.off('event'))
    assert.strictEqual(ERR_INVALID_ARG, code)
  })

  it('#off - invalid arg: handler (not a function)', function () {
    const emitter = new EventEmitter()
    const code = errorCode(() => emitter.off('event', 'NOF'))
    assert.strictEqual(ERR_INVALID_ARG, code)
  })
})
