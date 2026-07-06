import Signal from '@syncpoint/signal'
import { Style, Stroke, Fill, Circle as CircleStyle, RegularShape } from 'ol/style'
import Point from 'ol/geom/Point'
import MultiPoint from 'ol/geom/MultiPoint'
import LineString from 'ol/geom/LineString'
import { compute, registerInvalidator } from './losCompute'

const DEFAULT_HEIGHT_M = 1.7

const visibleStroke = new Stroke({ color: 'rgba(0, 180, 60, 0.95)', width: 4 })
const blockedStroke = new Stroke({ color: 'rgba(220, 30, 30, 0.95)', width: 4, lineDash: [8, 6] })
const pendingStroke = new Stroke({ color: 'rgba(120, 120, 120, 0.8)', width: 3, lineDash: [4, 6] })
const haloStroke = new Stroke({ color: 'rgba(255, 255, 255, 0.85)', width: 7 })

const observerImage = new CircleStyle({
  radius: 7,
  fill: new Fill({ color: 'rgba(0, 120, 220, 0.95)' }),
  stroke: new Stroke({ color: '#fff', width: 2 })
})

const blockerImage = new RegularShape({
  points: 4,
  radius: 9,
  angle: Math.PI / 4,
  fill: new Fill({ color: 'rgba(220, 30, 30, 0.95)' }),
  stroke: new Stroke({ color: '#fff', width: 2 })
})

const clipImage = new CircleStyle({
  radius: 5,
  fill: new Fill({ color: 'rgba(220, 140, 0, 0.9)' }),
  stroke: new Stroke({ color: '#fff', width: 2 })
})

const handleImage = new CircleStyle({
  radius: 5,
  fill: new Fill({ color: 'white' }),
  stroke: new Stroke({ color: 'rgba(0, 120, 220, 0.95)', width: 2 })
})

const buildStyles = (geometry, result, selected) => {
  const coords = geometry.getCoordinates()
  if (coords.length < 2) return []

  const styles = []
  const push = options => styles.push(new Style(options))

  if (selected) push({ stroke: haloStroke, geometry, zIndex: 0 })

  if (!result) {
    // no terrain available (yet) or observer/target without data
    push({ stroke: pendingStroke, geometry, zIndex: 1 })
  } else {
    const { samples, firstBlocker, clipped } = result
    const visibleEnd = firstBlocker ? firstBlocker.index : samples.length - 1
    const coordsOf = xs => xs.map(s => s.coordinate)

    push({
      stroke: visibleStroke,
      geometry: new LineString(coordsOf(samples.slice(0, visibleEnd + 1))),
      zIndex: 1
    })

    if (firstBlocker) {
      push({
        stroke: blockedStroke,
        geometry: new LineString(coordsOf(samples.slice(firstBlocker.index))),
        zIndex: 1
      })
      push({ image: blockerImage, geometry: new Point(firstBlocker.coordinate), zIndex: 5 })
    }

    if (clipped) {
      const last = samples[samples.length - 1].coordinate
      // remainder beyond the 10 km analysis range
      push({ stroke: pendingStroke, geometry: new LineString([last, coords[coords.length - 1]]), zIndex: 1 })
      push({ image: clipImage, geometry: new Point(last), zIndex: 5 })
    }
  }

  push({ image: observerImage, geometry: new Point(coords[0]), zIndex: 10 })
  if (selected) {
    push({ image: handleImage, geometry: new MultiPoint([coords[0], coords[coords.length - 1]]), zIndex: 11 })
  }

  return styles
}

/**
 * Style orchestrator for Line-of-Sight features. The sight-line analysis
 * is asynchronous (terrain tiles); $.losResult starts as null (rendered
 * as pending line) and is pushed when the profile arrives.
 */
export default ($, featureId) => {
  $.losResult = Signal.of(null)
  $.selected = $.selectionMode.map(mode => mode !== 'default')

  let generation = 0
  let latest = null

  const recompute = ({ geometry, properties }) => {
    const coords = geometry.getCoordinates()
    if (coords.length < 2) return
    const gen = ++generation
    compute({
      observer: coords[0],
      target: coords[coords.length - 1],
      observerHeight: properties?.observerHeight ?? DEFAULT_HEIGHT_M,
      targetHeight: properties?.targetHeight ?? DEFAULT_HEIGHT_M
    }).then(result => {
      if (gen !== generation) return // superseded by a newer geometry/height
      $.losResult(result ?? null)
    })
  }

  Signal.link((geometry, properties) => ({ geometry, properties }), [$.geometry, $.properties])
    .on(input => { latest = input; recompute(input) })

  // restyle once terrain becomes available after the feature was loaded
  registerInvalidator(featureId, () => latest && recompute(latest))

  return Signal.link(buildStyles, [$.geometry, $.losResult, $.selected])
}
