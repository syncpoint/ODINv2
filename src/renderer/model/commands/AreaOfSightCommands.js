import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

const hasTerrainService = async (store) => {
  const tuples = await store.tuples(ID.TILE_SERVICE_SCOPE)
  return tuples.some(([, service]) =>
    service?.capabilities?.contentType === 'terrain/mapbox-rgb' ||
    service?.terrain?.length > 0
  )
}

const AreaOfSight = function (services) {
  this.emitter = services.emitter
  this.store = services.store
  this.label = 'Area of Sight'
  this.path = 'mdiEyeCircle'
  this.isEnabled = false

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

Object.assign(AreaOfSight.prototype, EventEmitter.prototype)

AreaOfSight.prototype.execute = function () {
  this.emitter.emit('AREA_OF_SIGHT')
}

AreaOfSight.prototype.enabled = function () {
  return this.isEnabled
}

export default services => ({
  AREA_OF_SIGHT: new AreaOfSight(services)
})
