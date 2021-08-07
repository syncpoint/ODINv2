import * as R from 'ramda'
import VectorSource from 'ol/source/Vector'

export function Partition (source, selection) {
  this.selection_ = selection
  this.deselected_ = new VectorSource()
  this.selected_ = new VectorSource()
  this.sources_ = [this.deselected_, this.selected_]

  source.on('addfeature', ({ feature }) => this.addFeature(feature))
  source.on('removefeature', ({ feature }) => this.removeFeature(feature))

  const movetoSelected = Partition.moveFeature(this.deselected_, this.selected_)
  const movetoDeselected = Partition.moveFeature(this.selected_, this.deselected_)

  selection.on('selection', ({ selected, deselected }) => {
    deselected.map(id => this.selected_.getFeatureById(id)).forEach(movetoDeselected)
    selected.map(id => this.deselected_.getFeatureById(id)).forEach(movetoSelected)
  })

  // Pull features from original source:
  this.addFeatures(source.getFeatures())
}

Partition.moveFeature = (from, to) => feature => {
  if (!feature) return
  from.removeFeature(feature)
  to.addFeature(feature)
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
Partition.prototype.addFeatures = function (features) {
  const isSelected = feature => this.selection_.isSelected(feature.getId())
  const [selected, deselected] = R.partition(isSelected, features)
  this.selected_.addFeatures(selected)
  this.deselected_.addFeatures(deselected)
}

/**
 * @private
 */
Partition.prototype.addFeature = function (feature) {
  this.selection_.isSelected(feature.getId())
    ? this.selected_.addFeature(feature)
    : this.deselected_.addFeature(feature)
}

/**
 * @private
 */
Partition.prototype.removeFeature = function (feature) {
  this.selection_.isSelected(feature.getId())
    ? this.selected_.removeFeature(feature)
    : this.deselected_.removeFeature(feature)
}
