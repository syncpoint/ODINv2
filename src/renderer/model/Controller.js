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
    // TODO: primary/secondary action
  },

  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {}
}

const layer = {
  onClick (id, event, spec) {
    if (spec.match(/SYSTEM:HIDDEN/)) this.store_.show(id)
    else if (spec.match(/SYSTEM:VISIBLE/)) this.store_.hide(id)
  },

  onDoubleClick (id, event) {
    // TODO: primary/secondary action
  },

  onMouseDown (id, event, spec) {
    if (spec.match(/SCOPE:.*:identify/)) this.emitter_.emit(`${id}/identify/down`)
  },

  onMouseUp (id, event, spec) {
    if (spec.match(/SCOPE:.*:identify/)) this.emitter_.emit(`${id}/identify/up`)
  }
}

const symbol = {
  onClick (id, event, spec) {},
  onMouseDown (id, event, spec) {},
  onMouseUp (id, event, spec) {},

  onDoubleClick (id) {
    // Primary action: draw/insert.
    this.emitter_.emit(`command/entry/draw`, { id })
  }
}

export function Controller (store, emitter) {
    this.store_ = store
    this.emitter_ = emitter
    this.scopes_ = {
      feature,
      layer,
      symbol
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
