import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'


/**
 *
 */
const SetDefaultLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.path = 'mdiCreation'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(SetDefaultLayer.prototype, EventEmitter.prototype)

SetDefaultLayer.prototype.execute = function () {
  this.store.setDefaultLayer(this.selected()[0])
}

SetDefaultLayer.prototype.enabled = function () {
  return this.selected().length === 1
}

SetDefaultLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}


/**
 *
 */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.emitter = services.emitter
  this.label = 'Create Layer'
}

CreateLayer.prototype.execute = async function () {
  const key = ID.layerId()
  await this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])

  this.emitter.emit('ui.sidebar.focus', {
    scope: `@${ID.scope(key)}`,
    id: key
  })
}


export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_CREATE: new CreateLayer(services)
})
