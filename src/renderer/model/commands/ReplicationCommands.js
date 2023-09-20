import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

const JoinLayer = function (services) {
  this.selection = services.selection
  this.emitter = services.emitter
  this.operational = services.signals['replication/operational']
  this.operational.on(() => this.emit('changed'))
  this.path = 'mdiCloudDownloadOutline'
  this.toolTip = 'Join the selected layer'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(JoinLayer.prototype, EventEmitter.prototype)

JoinLayer.prototype.execute = function () {
  const selected = this.selected()
  selected.forEach(invitationId => this.emitter.emit(`replication/join/${invitationId}`))
}

JoinLayer.prototype.enabled = function () {
  return this.operational() &&
         this.selected().length > 0
}

JoinLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isInvitedId)
}
const ShareLayer = function (services) {
  this.replicationProivder = services.replicationProvider
  this.selection = services.selection
  this.emitter = services.emitter
  this.operational = services.signals['replication/operational']
  this.operational.on(() => this.emit('changed'))
  this.path = 'mdiCloudUploadOutline'
  this.toolTip = 'Share the selected layer'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(ShareLayer.prototype, EventEmitter.prototype)

ShareLayer.prototype.execute = function () {
  const selected = this.selected()
  selected.forEach(layerId => this.emitter.emit(`replication/share/${layerId}`))
}

ShareLayer.prototype.enabled = function () {
  return this.operational() &&
         this.selected().length > 0
}

ShareLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}

export default services => ({
  REPLICATION_LAYER_JOIN: new JoinLayer(services),
  REPLICATION_LAYER_SHARE: new ShareLayer(services)
})
