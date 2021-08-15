export function FeatureSnapshot (selection, layerStore) {
  this.layerStore_ = layerStore
  this.snapshot_ = {}

  selection.on('selection', async ({ selected, deselected }) => {
    deselected.forEach(id => delete this.snapshot_[id])
    const features = await Promise.all(selected.map(id => layerStore.getFeatureProperties(id)))
    features.forEach(feature => (this.snapshot_[feature.id] = feature))

    console.log('snapshot', this.snapshot_)
  })
}

FeatureSnapshot.prototype.restore = async function () {
  console.log(Object.values(this.snapshot_))
  await this.layerStore_.updateProperties(Object.values(this.snapshot_))
}
