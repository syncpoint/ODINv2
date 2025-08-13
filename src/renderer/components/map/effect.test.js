import assert from 'assert'
import effect from './effect'

describe('map effect', () => {
  it('disconnects observer and disposes map on cleanup', async function () {
    let disposed = false
    const map = {
      dispose: () => { disposed = true },
      updateSize: () => {}
    }

    let disconnected = false
    const OriginalRO = global.ResizeObserver
    const OriginalDoc = global.document
    class RO {
      constructor () {}
      observe () {}
      disconnect () { disconnected = true }
    }
    global.ResizeObserver = RO
    global.document = { getElementById: () => ({}) }

    const init = effect({
      services: {},
      ref: { current: {} },
      symbolPropertiesShowing: () => {},
      ol: { Map: function () { return map } },
      ScaleLine: function () {},
      Rotate: function () {},
      defaultInteractions: () => {},
      vectorSources: async () => ({}),
      createMapView: async () => ({}),
      createLayerStyles: () => ({}),
      createVectorLayers: () => ({}),
      createTileLayers: async () => ([]),
      registerEventHandlers: () => {},
      registerGraticules: () => {},
      measure: () => {},
      print: () => {}
    })

    const cleanup = init()
    await new Promise(resolve => setImmediate(resolve))
    cleanup()
    global.ResizeObserver = OriginalRO
    global.document = OriginalDoc

    assert.ok(disposed)
    assert.ok(disconnected)
  })
})

