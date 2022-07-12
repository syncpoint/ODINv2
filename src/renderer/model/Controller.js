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
    if (spec.match(/SYSTEM:HIDDEN/)) this.store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) this.store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.store.lock(ids)
  },

  onDoubleClick (id, event) {},

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
    if (spec.match(/SYSTEM:HIDDEN/)) this.store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) this.store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.store.lock(ids)
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
    const links = await this.store.values([id])
    links.forEach(link => this.ipcRenderer.send('OPEN_LINK', link))
  }
}

const marker = {
  onClick (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SYSTEM:HIDDEN/)) this.store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) this.store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.store.lock(ids)
  },

  async onDoubleClick (id) {
    const markers = await this.store.values([id])
    if (markers.length === 1) {
      const center = markers[0].geometry.coordinates
      this.emitter.emit('map/flyto', { center })
    }
  },

  onMouseDown (id, event, spec) {
    const ids = this.selected(id)
    if (spec.match(/SCOPE:MARKER/)) this.emitter.emit('highlight/on', { ids })
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:MARKER/)) this.emitter.emit('highlight/off')
  }
}

export function Controller (store, emitter, ipcRenderer, selection) {
  this.store = store
  this.emitter = emitter
  this.ipcRenderer = ipcRenderer
  this.selection = selection

  this.scopes_ = {
    feature,
    layer,
    symbol,
    'link+layer': link,
    'link+feature': link,
    marker
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
