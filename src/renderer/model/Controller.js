import { scope } from '../ids'

const NOOP = {
  onClick: () => {},
  onDoubleClick: () => {},
  onMouseDown: () => {},
  onMouseUp: () => {}
}

const feature = {
  onClick (id, event, spec) {
    if (spec.match(/SYSTEM:HIDDEN/)) this.store_.show(id)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store_.hide(id)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    if (spec.match(/SCOPE:FEATURE/)) this.highlight_.down(id)
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:FEATURE/)) this.highlight_.up()
  }
}

const layer = {
  onClick (id, event, spec) {
    if (spec.match(/SYSTEM:HIDDEN/)) this.store_.show(id)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store_.hide(id)
  },

  onDoubleClick (id, event) {
  },

  onMouseDown (id, event, spec) {
    if (spec.match(/SCOPE:LAYER/)) this.highlight_.down(id)
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:LAYER/)) this.highlight_.up()
  }
}

const symbol = {
  onClick (id, event, spec) {},
  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {},

  onDoubleClick (id) {
    // Primary action: draw/insert.
    this.emitter_.emit('command/entry/draw', { id })
  }
}

const link = {
  onClick (id, event, spec) {},
  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {},

  async onDoubleClick (id) {
    const links = await this.store_.select(id)
    links.forEach(link => this.ipcRenderer_.send('OPEN_LINK', link))
  }
}

export function Controller (store, highlight, emitter, ipcRenderer) {
  this.store_ = store
  this.highlight_ = highlight
  this.emitter_ = emitter
  this.ipcRenderer_ = ipcRenderer

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
