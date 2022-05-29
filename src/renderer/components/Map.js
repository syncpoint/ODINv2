/* eslint-disable */
import * as R from 'ramda'
import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import ScaleLine from 'ol/control/ScaleLine'
import { Fill, Stroke, Circle, Style } from 'ol/style'
import '../epsg'
import { useServices } from './hooks'
import { featureStyle } from '../ol/style'
import { Partition } from '../ol/source/Partition'
import defaultInteractions from '../ol/interaction'
import { filteredSource } from '../model/Sources'
import * as Sources from '../model/Sources'

/**
 *
 */
export const Map = () => {
  const {
    sessionStore,
    ipcRenderer,
    selection,
    dragAndDrop,
    store,
    undo,
    emitter,
    viewMemento
  } = useServices()

  const effect = async () => {
    const target = 'map'
    const controls = [
      new Rotate(), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128 })
    ]

    const viewport = await sessionStore.getViewport()
    const view = new ol.View({ ...viewport })

    const featureSource = Sources.featureSource(store)
    const { visibleSource } = Sources.visibilityTracker(featureSource, store)
    const { selectedSource, deselectedSource } = Sources.selectionTracker(visibleSource, selection)

    const style = featureStyle(selection, featureSource)
    const declutter = false
    const vectorLayer = source => new VectorLayer({ style, source, declutter })
    const featureLayer = vectorLayer(deselectedSource)
    const selectedLayer = vectorLayer(selectedSource)

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
      selectedLayer,
      // highlightLayer
    ]

    view.on('change', ({ target: view }) => viewMemento.update(view))

    const map = new ol.Map({
      target,
      controls,
      layers,
      view,
      interactions: []
    })

    const interactions = defaultInteractions({
      hitTolerance: 3,
      selection,
      store,
      undo,
      emitter,
      map,
      style,
      visibleSource,
      selectedSource
    })

    interactions.getArray().forEach(interaction => map.addInteraction(interaction))


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
    const updateOpacity = () => {
      const count = selectedSource.getFeatures().length
      featureLayer.setOpacity(count ? 0.35 : 1)
    }

    selectedSource.on('addfeature', updateOpacity)
    selectedSource.on('removefeature', updateOpacity)

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

    // TODO: does not really belong here -> move!
    emitter.on('command/delete', () => store.delete(selection.selected()))

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
