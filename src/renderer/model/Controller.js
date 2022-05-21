import { scope } from '../ids'

const NOOP = {
  onClick: () => {},
  onDoubleClick: () => {},
  onMouseDown: () => {},
  onMouseUp: () => {}
}

const feature = {
  onClick (id, event, spec) {
    if (spec.match(/SYSTEM:HIDDEN/)) this.store.show(id)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store.hide(id)
    else if (spec.match(/SYSTEM:LOCKED/)) this.store.unlock(id)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.store.lock(id)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    if (spec.match(/SCOPE:FEATURE/)) this.highlight.down(id)
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:FEATURE/)) this.highlight.up()
  }
}

const layer = {
  onClick (id, event, spec) {
    if (spec.match(/SYSTEM:HIDDEN/)) this.store.show(id)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store.hide(id)
    else if (spec.match(/SYSTEM:LOCKED/)) this.store.unlock(id)
    else if (spec.match(/SYSTEM:UNLOCKED/)) this.store.lock(id)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    if (spec.match(/SCOPE:LAYER/)) this.highlight.down(id)
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:LAYER/)) this.highlight.up()
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
    const links = await this.store.selectProperties(id)
    links.forEach(link => this.ipcRenderer.send('OPEN_LINK', link))
  }
}

export function Controller (store, highlight, emitter, ipcRenderer) {
  this.store = store
  this.highlight = highlight
  this.emitter = emitter
  this.ipcRenderer = ipcRenderer

  this.scopes_ = {
    feature,
    layer,
    symbol,
    'link+layer': link,
    'link+feature': link
  }
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
