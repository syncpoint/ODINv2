export default async services => {
  const { tileLayerStore } = services
  return tileLayerStore.tileLayers()
}
