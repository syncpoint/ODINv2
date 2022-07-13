import { markerId } from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/** */
const CreateMarker = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.viewMemento = services.viewMemento
  this.label = 'Create Marker'
}

CreateMarker.prototype.execute = function () {
  const key = markerId()
  this.selection.set([key])
  this.store.insert([[key, {
    name: `Marker - ${militaryFormat.now()}`,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: this.viewMemento.center()
    }
  }]])
}


export default services => ({
  MARKER_CREATE: new CreateMarker(services)
})
