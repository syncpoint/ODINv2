import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM, XYZ } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import ScaleLine from 'ol/control/ScaleLine'
import '../epsg'
import { useServices } from './hooks'
import { featureStyle } from '../ol/style'
import { Partition } from '../ol/source/Partition'
import defaultInteractions from '../ol/interaction'
import * as ids from '../ids'

const DEFAULT_VIEWPORT = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}


/**
 *
 */
export const Map = () => {
  const {
    sessionStore,
    ipcRenderer,
    sources,
    selection,
    dragAndDrop,
    store,
    undo,
    emitter
  } = useServices()

  const effect = async () => {
    const target = 'map'
    const controls = [
      new Rotate(), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128 })
    ]

    const viewport = await sessionStore.getViewport(DEFAULT_VIEWPORT)
    const view = new ol.View({ ...viewport })
    const featureSource = await sources.getFeatureSource()
    const partition = new Partition(featureSource, selection)
    const style = featureStyle(selection, featureSource)
    const declutter = false
    const vectorLayer = source => new VectorLayer({ style, source, declutter })
    const featureLayer = vectorLayer(partition.getDeselected())
    const selectedLayer = vectorLayer(partition.getSelected())

    // http://localhost:8000/services
    // http://localhost:8000/services/omk50_33
    // http://localhost:8000/services/omk50_33/tiles/{z}/{x}/{y}.jpg
    // const source = new XYZ({ url: 'http://localhost:8000/services/omk50_33/tiles/{z}/{x}/{y}.jpg' })
    const source = new OSM()
    const tileLayer = new TileLayer({ source })
    tileLayer.setOpacity(0.55)

    const layers = [
      tileLayer,
      featureLayer,
      selectedLayer
    ]

    const interactions = defaultInteractions({
      hitTolerance: 3,
      selection,
      store,
      undo,
      partition,
      featureLayer,
      selectedLayer,
      featureSource,
      style
    })

    view.on('change', ({ target: view }) => {
      sessionStore.putViewport({
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })

    const map = new ol.Map({
      target,
      controls,
      layers,
      view,
      interactions
    })

    // Map-related keys/shortcuts:
    map.addEventListener('keydown', event => {
      const { key } = event.originalEvent
      if (key === 'Escape') selection.set([])
    }, false)

    // Send map preview every 5 minutes to main process.

    const sendPreview = target => {

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
      const size = target.getSize()
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

      const reschedule = () => map.once('rendercomplete', ({ target }) => sendPreview(target))
      setTimeout(reschedule, 5 * 60 * 1000)
    }

    map.once('rendercomplete', ({ target }) => sendPreview(target))

    // Dim feature layer when we have a selection:
    selection.on('selection', ({ selected }) => {
      // Only consider selected features:
      const features = selected.filter(id => ids.isFeatureId(id))
      featureLayer.setOpacity(features.length ? 0.5 : 1)
    })

    const selectAll = () => {
      const element = document.activeElement
      const isBody = element => element.nodeName.toLowerCase() === 'body'
      const isMap = element => element.id === 'map'
      if (!element) return
      if (!isBody(element) && !isMap(element)) return

      const ids = featureSource.getFeatures().map(feature => feature.getId())
      selection.select(ids)
    }

    ipcRenderer.on('EDIT_SELECT_ALL', selectAll)
    emitter.on('command/delete', () => store.del(selection.selected()))

    // Setup Drag'n Drop.
    ;(() => {
      // Note: Neither dragstart nor dragend events are fired when dragging
      // a file into the browser from the OS.
      const map = document.getElementById('map')
      map.addEventListener('dragenter', event => dragAndDrop.dragenter(event))
      map.addEventListener('dragleave', event => dragAndDrop.dragleave(event))
      map.addEventListener('dragover', event => dragAndDrop.dragover(event), false)
      map.addEventListener('drop', event => dragAndDrop.drop(event), false)
    })()
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    (async () => effect())()
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return <div
    id='map'
    className='map fullscreen'
    tabIndex='0'
  />
}
