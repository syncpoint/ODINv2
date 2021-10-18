export function ViewMemento (sessionStore) {
  this.sessionStore_ = sessionStore

  ;(async () => {
    const viewport = await this.sessionStore_.getViewport()
    this.center_ = viewport.center
    this.resolution_ = viewport.resolution
    this.rotation_ = viewport.rotation
  })()
}

ViewMemento.prototype.update = function (view) {
  this.center_ = view.getCenter()
  this.resolution_ = view.getResolution()
  this.rotation_ = view.getRotation()

  this.sessionStore_.putViewport({
    center: this.center_,
    resolution: this.resolution_,
    rotation: this.rotation_
  })
}

ViewMemento.prototype.center = function () {
  return this.center_
}

ViewMemento.prototype.resolution = function () {
  return this.resolution_
}

ViewMemento.prototype.rotation = function () {
  return this.rotation_
}
