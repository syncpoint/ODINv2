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
  const { ipcRenderer } = services

  // Adapted from: https://openlayers.org/en/latest/examples/export-map.html
  const draw = context => canvas => {
    if (canvas.width > 0) {
      const opacity = canvas.parentNode.style.opacity
      context.globalAlpha = opacity === '' ? 1 : Number(opacity)
      const transform = canvas.style.transform

      // Get the transform parameters from the style's transform matrix
      const matrix = transform
        .match(/^matrix\(([^(]*)\)$/)[1]
        .split(',')
        .map(Number)

      // Apply the transform to the export map context
      CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix)
      context.drawImage(canvas, 0, 0)
    }
  }

  const canvas = document.createElement('canvas')
  const size = map.getSize()
  canvas.width = size[0]
  canvas.height = size[1]
  const context = canvas.getContext('2d')

  const list = document.querySelectorAll('.ol-layer canvas')
  Array.prototype.forEach.call(list, draw(context))

  try {
    const url = canvas.toDataURL()
    ipcRenderer.send('PREVIEW', url)
  } catch (err) {
    // FIXME: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
    // console.error('[PREVIEW]', err.message)
  }

  // Send map preview every 5 minutes to main process.
  const reschedule = () => map.once('rendercomplete', ({ target }) => sendPreview(services, target))
  setTimeout(reschedule, 5 * 60 * 1000)
}

/**
 *
 */
const mapHandlers = (services, map) => {
  const { selection, osdDriver, dragAndDrop } = services

  map.addEventListener('keydown', event => {
    const { key } = event.originalEvent
    if (key === 'Escape') selection.set([])
  }, false)

  map.once('rendercomplete', ({ target }) => sendPreview(services, target))
  map.on('pointermove', throttle(75, event => osdDriver.pointermove(event)))

  // Note: Neither dragstart nor dragend events are fired when dragging
  // a file into the browser from the OS.
  const target = document.getElementById('map')
  target.addEventListener('dragenter', event => dragAndDrop.dragenter(event))
  target.addEventListener('dragleave', event => dragAndDrop.dragleave(event))
  target.addEventListener('dragover', event => dragAndDrop.dragover(event), false)
  target.addEventListener('drop', event => dragAndDrop.drop(event), false)

  map.addEventListener('click', () => {
    const include = [ID.isTileServiceId, ID.isTilePresetId]
    const deselect = selection.selected(x => include.some(p => p(x)))
    selection.deselect(deselect)
  })
}


/**
 *
 */
const ipcHandlers = (services, sources) => {
  const { ipcRenderer, selection } = services
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

  ipcRenderer.on('EDIT_SELECT_ALL', selectAll)
}


/**
 * FIXME: Wrong place: Move somewhere else.
 */
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
