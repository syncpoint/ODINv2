import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

const hasTerrainService = async (store) => {
  const tuples = await store.tuples(ID.TILE_SERVICE_SCOPE)
  return tuples.some(([, service]) => service?.capabilities?.contentType === 'terrain/mapbox-rgb')
}

const ElevationProfile = function (services) {
  this.emitter = services.emitter
  this.store = services.store
  this.label = 'Elevation Profile'
  this.path = 'mdiChartAreaspline'
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

Object.assign(ElevationProfile.prototype, EventEmitter.prototype)

ElevationProfile.prototype.execute = function () {
  this.emitter.emit('ELEVATION_PROFILE')
}

ElevationProfile.prototype.enabled = function () {
  return this.isEnabled
}

export default services => ({
  ELEVATION_PROFILE: new ElevationProfile(services)
})
