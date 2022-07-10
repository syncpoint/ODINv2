import { Vector as VectorLayer } from 'ol/layer'


const highlightLayer = (sources, styles) => {
  const { highlightSource } = sources
  const { highlightStyle } = styles
  return new VectorLayer({
    source: highlightSource,
    style: highlightStyle,
    updateWhileAnimating: true
  })
}


export default (sources, styles) => {
  const { deselectedSource, selectedSource, markerSource } = sources
  const { defaultStyle: style } = styles
  const declutter = false
  const vectorLayer = source => new VectorLayer({
    style,
    source,
    declutter,
    selectable: true // non-standard: considered by select interaction
  })

  return {
    featureLayer: vectorLayer(deselectedSource),
    highlightLayer: highlightLayer(sources, styles),
    selectedLayer: vectorLayer(selectedSource),
    markerLayer: vectorLayer(markerSource)
  }
}
