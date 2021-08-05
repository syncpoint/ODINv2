import VectorSource from 'ol/source/Vector'

export function Partition (source, selection) {
  this.selection_ = selection
  this.deselected_ = new VectorSource()
  this.selected_ = new VectorSource()
  this.sources_ = [this.deselected_, this.selected_]

  source.on('addfeature', ({ feature }) => this.addFeature(feature))
  source.on('removefeature', ({ feature }) => this.removeFeature(feature))

  const featureById = this.featureById.bind(this)
  const movetoSelected = Partition.moveFeature(this.deselected_, this.selected_)
  const movetoDeselected = Partition.moveFeature(this.selected_, this.deselected_)

  selection.on('selection', ({ selected, deselected }) => {
    selected.map(featureById).forEach(movetoSelected)
    deselected.map(featureById).forEach(movetoDeselected)
  })

  // Pull features from original source:
  source.getFeatures().forEach(this.addFeature.bind(this))
}

Partition.moveFeature = (from, to) => feature => {
  if (!feature) return
  if (from.hasFeature(feature)) from.removeFeature(feature)
  if (!to.hasFeature(feature)) to.addFeature(feature)
}

Partition.prototype.featureById = function (id) {
  return this.sources_.reduce((acc, source) => {
    return acc || source.getFeatureById(id)
  }, null)
}

Partition.prototype.getDeselected = function () {
  return this.deselected_
}

Partition.prototype.getSelected = function () {
  return this.selected_
}

/**
 * @private
 */
Partition.prototype.addFeature = function (feature) {
  this.selection_.isSelected(feature.getId())
    ? this.selected_.addFeature(feature)
    : this.deselected_.addFeature(feature)
}

Partition.prototype.removeFeature = function (feature) {
  this.selection_.isSelected(feature.getId())
    ? this.selected_.removeFeature(feature)
    : this.deselected_.removeFeature(feature)
}
