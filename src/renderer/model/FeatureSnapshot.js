export function FeatureSnapshot (selection, layerStore) {
  this.layerStore_ = layerStore
  this.snapshot_ = {}

  selection.on('selection', async ({ selected, deselected }) => {
    deselected.forEach(id => delete this.snapshot_[id])
    const features = await Promise.all(selected.map(id => layerStore.getFeatureProperties(id)))
    features.forEach(feature => (this.snapshot_[feature.id] = feature))
  })
}

FeatureSnapshot.prototype.restore = async function () {
  await this.layerStore_.updateProperties(Object.values(this.snapshot_))
}
