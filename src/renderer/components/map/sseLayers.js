export default async services => {
  const { sseLayerStore } = services
  return sseLayerStore.sseLayers()
}
