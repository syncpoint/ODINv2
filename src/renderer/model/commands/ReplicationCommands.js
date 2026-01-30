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
  selected.forEach(invitationId => this.emitter.emit(`replication/join/${invitationId}/NO-PARAM-REQUIRED`))
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
  selected.forEach(layerId => this.emitter.emit(`replication/share/${layerId}/NO-PARAM-REQUIRED`))
}

ShareLayer.prototype.enabled = function () {
  return this.operational() &&
         this.selected().length > 0
}

ShareLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}

const LeaveLayer = function (services) {
  this.replicationProivder = services.replicationProvider
  this.selection = services.selection
  this.emitter = services.emitter
  this.store = services.store
  this.path = 'mdiCloudCancelOutline'
  this.toolTip = 'Leave the selected layer'

  this.operational = services.signals['replication/operational']
  this.operational.on(() => this.emit('changed'))

  this.isEnabled = false

  this.selection.on('selection', async () => {
    if (this.selected().length === 0) {
      this.isEnabled = false
    } else {
      const [shared] = await this.store.collect(this.selection.selected()[0], [ID.sharedId, ID.roleId])
      this.isEnabled = shared // (shared && role?.self !== 'OWNER')
    }
    this.emit('changed')
  })
}
Object.assign(LeaveLayer.prototype, EventEmitter.prototype)

LeaveLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}

LeaveLayer.prototype.enabled = function () {
  return this.operational() && this.isEnabled
}

LeaveLayer.prototype.execute = function () {
  const selected = this.selected()
  selected.forEach(layerId => this.emitter.emit(`replication/leave/${layerId}/NO-PARAM-REQUIRED`))
}

export default services => ({
  REPLICATION_LAYER_JOIN: new JoinLayer(services),
  REPLICATION_LAYER_SHARE: new ShareLayer(services),
  REPLICATION_LAYER_LEAVE: new LeaveLayer(services)
})
