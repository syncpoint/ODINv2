import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/**
 *
 */
const CreateMarker = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.viewMemento = services.viewMemento
  this.emitter = services.emitter
  this.label = 'Create Marker'
}

CreateMarker.prototype.execute = function () {
  const key = ID.markerId()
  this.store.insert([[key, {
    name: `Marker - ${militaryFormat.now()}`,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: this.viewMemento.center()
    }
  }]])

  this.emitter.emit('ui.sidebar.focus', {
    scope: `@${ID.scope(key)}`,
    id: key
  })
}


export default services => ({
  MARKER_CREATE: new CreateMarker(services)
})
