import VectorSource from 'ol/source/Vector'

const strategy = callback => (extent, resolution) => {
  callback(extent, resolution)
  return [extent]
}

const vectorSource = callback => new VectorSource({
  features: [],
  useSpatialIndex: false,
  strategy: strategy(callback)
})

export default vectorSource
