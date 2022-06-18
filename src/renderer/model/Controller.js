import * as R from 'ramda'
import { scope } from '../ids'

const NOOP = {
  onClick: () => {},
  onDoubleClick: () => {},
  onMouseDown: () => {},
  onMouseUp: () => {}
}

const feature = {
  onClick (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SYSTEM:HIDDEN/)) this.featureStore.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.featureStore.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) this.featureStore.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.featureStore.lock(ids)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SCOPE:FEATURE/)) this.emitter.emit('highlight/on', { ids })
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:FEATURE/)) this.emitter.emit('highlight/off')
  }
}

const layer = {
  onClick (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SYSTEM:HIDDEN/)) this.featureStore.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.featureStore.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) this.featureStore.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.featureStore.lock(ids)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SCOPE:LAYER/)) this.emitter.emit('highlight/on', { ids })
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:LAYER/)) this.emitter.emit('highlight/off')
  }
}

const symbol = {
  onClick (id, event, spec) {},
  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {},

  onDoubleClick (id) {
    // Primary action: draw/insert.
    this.emitter.emit('command/entry/draw', { id })
  }
}

const link = {
  onClick (id, event, spec) {},
  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {},

  async onDoubleClick (id) {
    const links = await this.featureStore.values([id])
    links.forEach(link => this.ipcRenderer.send('OPEN_LINK', link))
  }
}

export function Controller (featureStore, emitter, ipcRenderer, selection) {
  this.featureStore = featureStore
  this.emitter = emitter
  this.ipcRenderer = ipcRenderer
  this.selection = selection

  this.scopes_ = {
    feature,
    layer,
    symbol,
    'link+layer': link,
    'link+feature': link
  }
}

Controller.prototype.selected = function (id) {
  return R.uniq([id, ...this.selection.selected()])
}

Controller.prototype.onClick = function (id, event, spec) {
  const handler = this.scopes_[scope(id)] || NOOP
  return handler.onClick.bind(this)(id, event, spec)
}

Controller.prototype.onDoubleClick = function (id, event) {
  const handler = this.scopes_[scope(id)] || NOOP
  return handler.onDoubleClick.bind(this)(id, event)
}

Controller.prototype.onMouseDown = function (id, event, spec) {
  const handler = this.scopes_[scope(id)] || NOOP
  return handler.onMouseDown.bind(this)(id, event, spec)
}

Controller.prototype.onMouseUp = function (id, event, spec) {
  const handler = this.scopes_[scope(id)] || NOOP
  return handler.onMouseUp.bind(this)(id, event, spec)
}