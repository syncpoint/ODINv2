import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import ScaleLine from 'ol/control/ScaleLine'
import '../epsg'
import { useServices } from './services'
import { featureStyle } from '../ol/style'
import { Partition } from '../ol/source/Partition'
import select from '../ol/interaction/select'

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
    dragAndDrop
  } = useServices()

  React.useEffect(async () => {
    const target = 'map'
    const controls = [
      new Rotate(), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128 })
    ]

    const viewport = await sessionStore.getViewport(DEFAULT_VIEWPORT)
    const view = new ol.View({ ...viewport })

    const features = await sources.getFeatureSource()
    const partition = new Partition(features, selection)

    ipcRenderer.on('EDIT_SELECT_ALL', () => {
      const element = document.activeElement
      const isBody = element => element.nodeName.toLowerCase() === 'body'
      const isMap = element => element.id === 'map'
      if (!element) return
      if (!isBody(element) && !isMap(element)) return

      const ids = partition.getDeselected().getFeatures().map(feature => feature.getId())
      selection.select(ids)
    })

    const featureLayer = new VectorLayer({ source: partition.getDeselected(), style: featureStyle(selection) })
    const selectedLayer = new VectorLayer({ source: partition.getSelected(), style: featureStyle(selection) })
    const layers = [
      new TileLayer({ source: new OSM() }),
      featureLayer,
      selectedLayer
    ]

    const selectInteraction = select({
      selection,
      selectedLayer,
      deselectedLayer: featureLayer
    })

    const interactions = defaultInteractions({ doubleClickZoom: false }).extend(
      [selectInteraction]
    )

    view.on('change', ({ target: view }) => {
      sessionStore.putViewport({
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })

    /* eslint-disable no-new */
    const map = new ol.Map({
      target,
      controls,
      layers,
      view,
      interactions
    })


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
        console.error('[PREVIEW]', err.message)
      }

      const reschedule = () => map.once('rendercomplete', ({ target }) => sendPreview(target))
      setTimeout(reschedule, 5 * 60 * 1000)
    }

    map.once('rendercomplete', ({ target }) => sendPreview(target))

    // Dim feature layer when we have a selection:
    selection.on('selection', ({ selected }) => {
      featureLayer.setOpacity(selected.length ? 0.35 : 1)
    })

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
  }, [])

  return <div
    id='map'
    className='map fullscreen'
    tabIndex='0'
  >
  </div>
}
