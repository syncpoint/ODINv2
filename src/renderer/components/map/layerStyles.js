import { Fill, Stroke, Circle, Style } from 'ol/style'
import { isMarkerId } from '../../ids'
import { featureStyle, markerStyle } from '../../ol/style'

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

const defaultStyle = (services, sources) => {
  const { selection } = services
  const { featureSource } = sources
  const fs = featureStyle(selection, featureSource)
  const ms = markerStyle(selection)

  return (feature, resolution) => isMarkerId(feature.getId())
    ? ms(feature, resolution)
    : fs(feature, resolution)
}

export default (services, sources) => ({
  highlightStyle,
  defaultStyle: defaultStyle(services, sources)
})
