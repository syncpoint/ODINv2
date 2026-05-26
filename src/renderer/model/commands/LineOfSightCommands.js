import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

const hasTerrainService = async (store) => {
  const tuples = await store.tuples(ID.TILE_SERVICE_SCOPE)
  return tuples.some(([, service]) =>
    service?.capabilities?.contentType === 'terrain/mapbox-rgb' ||
    service?.terrain?.length > 0
  )
}

const hasWebGL2 = () => {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

const LineOfSight = function (services) {
  this.emitter = services.emitter
  this.store = services.store
  this.label = 'Line of Sight'
  this.path = 'mdiEye'
  this.isEnabled = false

  // WebGL2 is a hard requirement (shared with planned Area-of-Sight).
  // Without it, the command stays disabled regardless of terrain availability.
  this.webgl2_ = hasWebGL2()
  if (!this.webgl2_) return

  hasTerrainService(this.store).then(available => {
    this.isEnabled = available
    this.emit('changed')
  })

  this.store.on('batch', ({ operations }) => {
    const relevant = operations.some(({ key }) =>
      ID.isTileServiceId(key) || ID.isTilePresetId(key)
    )
    if (!relevant) return
    hasTerrainService(this.store).then(available => {
      if (this.isEnabled !== available) {
        this.isEnabled = available
        this.emit('changed')
      }
    })
  })
}

Object.assign(LineOfSight.prototype, EventEmitter.prototype)

LineOfSight.prototype.execute = function () {
  this.emitter.emit('LINE_OF_SIGHT')
}

LineOfSight.prototype.enabled = function () {
  return this.isEnabled
}

export default services => ({
  LINE_OF_SIGHT: new LineOfSight(services)
})
