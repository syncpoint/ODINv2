import assert from 'assert'
import * as R from 'ramda'
import Signal from '@syncpoint/signal'

import symbol from './symbol'

describe('symbol style', () => {
  it('updates modifiers when preference toggles', () => {
    const properties = Signal.of({ sidc: 'SFGPUCI----', t: 'A' })
    const show = Signal.of(true)
    const selectionMode = Signal.of('single')
    const styleRegistry = Signal.of(R.identity)
    const styleFactory = Signal.of(R.identity)

    const $ = { properties, symbolPropertiesShowing: show, selectionMode, styleRegistry, styleFactory }
    symbol($)

    const shapes = []
    $.shape.on(s => shapes.push(s))

    assert.strictEqual(shapes.length, 1)
    assert.deepStrictEqual(shapes[0][0]['symbol-modifiers'], { uniqueDesignation: 'A' })

    show(false)
    assert.strictEqual(shapes.length, 2)
    assert.deepStrictEqual(shapes[1][0]['symbol-modifiers'], {})

    show(true)
    assert.strictEqual(shapes.length, 3)
    assert.deepStrictEqual(shapes[2][0]['symbol-modifiers'], { uniqueDesignation: 'A' })
    assert(shapes.every(s => s.length === 1 && s[0].id === 'style:2525c/symbol'))
    assert.strictEqual(shapes[0], shapes[2])
  })

  it('throttles rapid style updates', () => {
    const properties = Signal.of({ sidc: 'SFGPUCI----', t: 'A' })
    const show = Signal.of(true)
    const selectionMode = Signal.of('single')
    const styleRegistry = Signal.of(R.identity)
    const styleFactory = Signal.of(R.identity)

    const $ = { properties, symbolPropertiesShowing: show, selectionMode, styleRegistry, styleFactory }
    symbol($)

    const styles = []
    $.styles.on(s => styles.push(s))

    for (let i = 0; i < 25; i++) {
      show(i % 2 === 1)
    }

    assert(styles.length <= 11)
  })
})

