import { Fill, Stroke, Circle, Style } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer'

const highlightStyle = (() => {
  const fill = new Fill({ color: 'rgba(255,50,50,0.4)' })
  const stroke = new Stroke({ color: 'black', width: 1, lineDash: [10, 5] })
  return [
    new Style({
      image: new Circle({ fill, stroke, radius: 50 }),
      fill,
      stroke
    })
  ]
})()


const highlightLayer = (sources, styles) => {
  const { highlightSource } = sources
  return new VectorLayer({
    source: highlightSource,
    style: highlightStyle,
    updateWhileAnimating: true
  })
}


export default (sources, styles) => {
  const { deselectedSource, selectedSource, featureSource } = sources
  const declutter = false
  const vectorLayer = source => new VectorLayer({
    source,
    declutter,
    selectable: true // non-standard: considered by select interaction,
  })

  return {
    // featureLayer: vectorLayer(deselectedSource),
    featureLayer: vectorLayer(featureSource),
    highlightLayer: highlightLayer(sources, styles),
    selectedLayer: vectorLayer(selectedSource),
  }
}
