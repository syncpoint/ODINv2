import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import { useServices } from './services'

/**
 *
 */
export const Map = () => {
  const { sessionStore, ipcRenderer, sources } = useServices()

  React.useEffect(async () => {
    const viewport = await sessionStore.getViewport({
      center: [1823376.75753279, 6143598.472197734], // Vienna
      resolution: 612,
      rotation: 0
    })

    console.time('sources')
    const featureSources = await sources.getFeatureSources()
    const featureCount = Object.entries(featureSources).reduce((acc, [key, source]) => acc + source.getFeatures().length, 0)
    console.log('featureCount', featureCount)
    const featureLayers = Object.entries(featureSources).map(([key, source]) => new VectorLayer({
      id: key,
      source,
      updateWhileAnimating: true
    }))

    const layers = [new TileLayer({ source: new OSM() }), ...featureLayers]
    console.timeEnd('sources')

    const target = 'map'
    const controls = [new Rotate()]

    const view = new ol.View(viewport)
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
      interactions: defaultInteractions({
        doubleClickZoom: false
      })
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
      const url = canvas.toDataURL()
      ipcRenderer.send('PREVIEW', url)

      const reschedule = () => map.once('rendercomplete', ({ target }) => sendPreview(target))
      setTimeout(reschedule, 5 * 60 * 1000)
    }

    map.once('rendercomplete', ({ target }) => sendPreview(target))
  }, [])

  return <div
    id='map'
    className='map fullscreen'
    tabIndex='0'
  >
  </div>
}
