import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

const hasTerrainService = async (store) => {
  const tuples = await store.tuples(ID.TILE_SERVICE_SCOPE)
  return tuples.some(([, service]) =>
    service?.capabilities?.contentType === 'terrain/mapbox-rgb' ||
    service?.terrain?.length > 0
  )
}

const ObserverSiting = function (services) {
  this.emitter = services.emitter
  this.store = services.store
  this.label = 'Observer Siting'
  this.path = 'mdiBinoculars'
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

Object.assign(ObserverSiting.prototype, EventEmitter.prototype)

ObserverSiting.prototype.execute = function () {
  this.emitter.emit('OBSERVER_SITING')
}

ObserverSiting.prototype.enabled = function () {
  return this.isEnabled
}

export default services => ({
  OBSERVER_SITING: new ObserverSiting(services)
})
