import { Stroke, Style, Fill, Circle as CircleStyle, RegularShape } from 'ol/style'

export const visibleSegmentStyle = new Style({
  stroke: new Stroke({ color: 'rgba(0, 180, 60, 0.95)', width: 4 }),
  zIndex: 1
})

export const blockedSegmentStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(220, 30, 30, 0.95)',
    width: 4,
    lineDash: [8, 6]
  }),
  zIndex: 1
})

export const observerPointStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: 'rgba(0, 120, 220, 0.95)' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  }),
  zIndex: 10
})

export const blockerPointStyle = new Style({
  image: new RegularShape({
    points: 4,
    radius: 9,
    angle: Math.PI / 4,
    fill: new Fill({ color: 'rgba(220, 30, 30, 0.95)' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  }),
  zIndex: 5
})

export const clipMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: 'rgba(220, 140, 0, 0.9)' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  }),
  zIndex: 5
})
