export function TagStore (store, featureStore) {
  this.store = store
  this.featureStore = featureStore
}

TagStore.prototype.addTag = async function (id, name) {
  if (name === 'default') this.featureStore.setDefaultLayer(id)
  else this.store.addTag(id, name)
}

TagStore.prototype.removeTag = async function (id, name) {
  this.store.removeTag(id, name)
}
