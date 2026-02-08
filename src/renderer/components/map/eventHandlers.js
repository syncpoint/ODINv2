import { throttle } from 'throttle-debounce'
import * as ID from '../../ids'

/**
 *
 */
const sourceHandlers = (sources, layers) => {
  const { selectedSource } = sources
  const { featureLayer } = layers

  const updateOpacity = () => {
    const count = selectedSource.getFeatures().length
    featureLayer.setOpacity(count ? 0.35 : 1)
  }

  selectedSource.on('addfeature', updateOpacity)
  selectedSource.on('removefeature', updateOpacity)
}


/**
 *
 */
const sendPreview = (services, map) => {
  // Adapted from: https://openlayers.org/en/latest/examples/export-map.html
  const draw = context => canvas => {
    if (canvas.width > 0) {
      const opacity = canvas.parentNode.style.opacity || canvas.style.opacity
      context.globalAlpha = opacity === '' ? 1 : Number(opacity)
      const transform = canvas.style.transform

      if (transform) {
        // Get the transform parameters from the style's transform matrix
        const matrix = transform
          .match(/^matrix\(([^(]*)\)$/)[1]
          .split(',')
          .map(Number)
        CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix)
      } else {
        // WebGL canvases may not have a CSS transform; derive from size ratio
        const matrix = [
          parseFloat(canvas.style.width) / canvas.width,
          0, 0,
          parseFloat(canvas.style.height) / canvas.height,
          0, 0
        ]
        CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix)
      }

      const backgroundColor = canvas.parentNode.style.backgroundColor
      if (backgroundColor) {
        context.fillStyle = backgroundColor
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      context.drawImage(canvas, 0, 0)
    }
  }

  const canvas = document.createElement('canvas')
  const size = map.getSize()
  canvas.width = size[0]
  canvas.height = size[1]
  const context = canvas.getContext('2d')

  // Match both child canvases (.ol-layer canvas) and WebGL canvases
  // that ARE the layer element (canvas.ol-layer).
  const list = map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer')
  Array.prototype.forEach.call(list, draw(context))
  context.globalAlpha = 1
  context.setTransform(1, 0, 0, 1, 0, 0)

  try {
    const url = canvas.toDataURL()
    window.odin.shell.sendPreview(url)
  } finally {
    canvas.remove()
  }

  // Send map preview every 5 minutes to main process.
  const reschedule = () => map.once('rendercomplete', ({ target }) => sendPreview(services, target))
  setTimeout(reschedule, 5 * 60 * 1000)
}

/**
 *
 */
const mapHandlers = (services, map) => {
  const { selection, osdDriver, dragAndDrop, emitter } = services

  map.addEventListener('keydown', event => {
    const { key } = event.originalEvent
    if (key === 'Escape') selection.set([])
  }, false)

  map.once('rendercomplete', ({ target }) => sendPreview(services, target))
  map.on('pointermove', throttle(75, event => osdDriver.pointermove(event)))

  // Deselect everything except features and markers.
  map.on('click', () => {
    const exclude = [ID.isFeatureId, ID.isMarkerId, ID.isMeasureId]
    const deselect = selection.selected(x => !exclude.some(p => p(x)))
    if (deselect.length) selection.deselect(deselect)
  })

  let resolution
  map.on('moveend', () => {
    const updated = map.getView().getResolution()
    if (updated !== resolution) {
      resolution = updated
      emitter.emit('view/resolution', { resolution })
    }
  })

  // Note: Neither dragstart nor dragend events are fired when dragging
  // a file into the browser from the OS.
  const target = document.getElementById('map')
  target.addEventListener('dragenter', event => dragAndDrop.dragenter(event))
  target.addEventListener('dragleave', event => dragAndDrop.dragleave(event))
  target.addEventListener('dragover', event => dragAndDrop.dragover(event), false)
  target.addEventListener('drop', event => dragAndDrop.drop(event), false)
}


/**
 *
 */
const ipcHandlers = (services, sources) => {
  const { selection } = services
  const { visibleSource } = sources

  const selectAll = () => {
    const element = document.activeElement
    const isBody = element => element.nodeName.toLowerCase() === 'body'
    const isMap = element => element.id === 'map'
    if (!element) return
    if (!isBody(element) && !isMap(element)) return

    const ids = visibleSource.getFeatures().map(feature => feature.getId())
    selection.select(ids)
  }

  window.odin.editing.onSelectAll(selectAll)
}


const emitterHandlers = services => {
  const { emitter, selection, store } = services
  emitter.on('command/delete', () => store.delete(selection.selected()))
}


/**
 *
 */
export default options => {
  const { services, sources, vectorLayers, map } = options
  sourceHandlers(sources, vectorLayers)
  mapHandlers(services, map)
  ipcHandlers(services, sources)
  emitterHandlers(services)
}
