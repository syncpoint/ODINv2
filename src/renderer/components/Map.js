/* eslint-disable */
import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import ScaleLine from 'ol/control/ScaleLine'
import Graticule from 'ol/layer/Graticule'
import { Fill, Stroke, Circle, Style } from 'ol/style'
import { throttle } from 'throttle-debounce'
import '../epsg'
import { useServices } from './hooks'
import { featureStyle, markerStyle } from '../ol/style'
import defaultInteractions from '../ol/interaction'
import * as Sources from '../model/Sources'
import { isMarkerId } from '../ids'
import './Map.css'

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
    featureStore,
    preferencesStore,
    undo,
    emitter,
    viewMemento,
    osdDriver
  } = useServices()

  const effect = async () => {
    const target = 'map'
    const controls = [
      new Rotate(), // macOS: OPTION + SHIFT + DRAG
      new ScaleLine({ bar: true, text: true, minWidth: 128 })
    ]

    const viewport = await sessionStore.getViewport()
    const view = new ol.View({ ...viewport })

    const featureSource = Sources.featureSource(featureStore)
    const markerSource = Sources.markerSource(featureStore)
    const { visibleSource } = Sources.visibilityTracker(featureSource, featureStore, emitter)
    const { unlockedSource } = Sources.lockedTracker(featureSource, featureStore)
    const selectableSource = Sources.union(visibleSource, markerSource)
    const { selectedSource, deselectedSource } = Sources.selectionTracker(selectableSource, selection)
    const highlightSource = Sources.highlightTracker(emitter, featureStore, viewMemento)
    const modifiableSource = Sources.intersect(unlockedSource, selectedSource)

    const fill = new Fill({ color: 'rgba(255,50,50,0.4)' })
    const stroke = new Stroke({ color: 'black', width: 1, lineDash: [10, 5] })
    const highlightStyle = [
      new Style({
        image: new Circle({ fill: fill, stroke: stroke, radius: 50 }),
        fill: fill,
        stroke: stroke
      })
    ]

    const highlightLayer = new VectorLayer({
      source: highlightSource,
      style: highlightStyle,
      updateWhileAnimating: true
    })

    const fs = featureStyle(selection, featureSource)
    const ms = markerStyle(selection)
    const style = (feature, resolution) => isMarkerId(feature.getId())
      ? ms(feature, resolution)
      : fs(feature, resolution)

    // const style = featureStyle(selection, featureSource)

    const declutter = false
    const vectorLayer = source => new VectorLayer({ style, source, declutter })
    const featureLayer = vectorLayer(deselectedSource)
    const selectedLayer = vectorLayer(selectedSource)
    const markerLayer = vectorLayer(markerSource)

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
      highlightLayer,
      markerLayer
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
      featureStore,
      undo,
      emitter,
      map,
      style,
      visibleSource,
      selectedSource,
      modifiableSource,
      selectableSource
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

    map.on('pointermove', throttle(75, event => osdDriver.pointermove(event)))

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

      const ids = visibleSource.getFeatures().map(feature => feature.getId())
      selection.select(ids)
    }

    ipcRenderer.on('EDIT_SELECT_ALL', selectAll)

    // TODO: does not really belong here -> move!
    emitter.on('command/delete', () => featureStore.delete(selection.selected()))

    emitter.on('map/flyto', ({ center }) => {
      const duration = 2000
      const zoom = view.getZoom()
      view.animate({ center, duration: duration })
      view.animate(
        { zoom: zoom - 1, duration: duration / 2 },
        { zoom: zoom, duration: duration / 2 }
      )
    })

    const type = await preferencesStore.get('graticule', null)
    let graticule = type
      ? type === 'WGS84'
        ? new Graticule({ showLabels: true, wrapX: false })
        : null
      : null

    if (graticule) map.addLayer(graticule)

    preferencesStore.on('graticuleChanged', ({ type, checked }) => {
      if (graticule) map.removeLayer(graticule)
      graticule = null

      if (checked) {
        graticule = type
          ? type === 'WGS84'
            ? new Graticule({ showLabels: true, wrapX: false })
            : null
          : null

        if (graticule) map.addLayer(graticule)
      }
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
