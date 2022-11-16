import { MouseWheelZoom, PinchZoom, DragZoom, KeyboardZoom } from 'ol/interaction'
import { getPointResolution } from 'ol/proj'

import { militaryFormat } from '../../../shared/datetime'
import { Marker } from './marker'
import paperSizes from './paperSizes.json'
import paddings from './paddings'
import toPDF from './pdf'

const DEFAULT_PAPER_SIZE = 'a4'
const DEFAULT_ORIENTATION = 'landscape'
const DEFAULT_SCALE = '25'
const DEFAULT_QUALITY = 96 * 2 // dpi
const INCH_TO_MM = 25.4

const setZoomInteractions = (map, active = true) => {
  map.getInteractions().forEach(interaction => {
    if (interaction instanceof MouseWheelZoom) interaction.setActive(active)
    else if (interaction instanceof KeyboardZoom) interaction.setActive(active)
    else if (interaction instanceof PinchZoom) interaction.setActive(active)
    else if (interaction instanceof DragZoom) interaction.setActive(active)
  })
}

const print = ({ map, services, options = {} }) => {

  let printSettings = {
    paperSize: options.paperSize || DEFAULT_PAPER_SIZE,
    orientation: options.orientation || DEFAULT_ORIENTATION,
    scale: options.scale || DEFAULT_SCALE,
    targetFormat: options.targetFormat || 'PDF',
    title: options.title || ''
  }

  const resizeVirtualPaper = () => {

    const targetElement = document.getElementById('map-container')
    const display = targetElement.parentElement.getBoundingClientRect()

    const paper = paperSizes[printSettings.paperSize][printSettings.orientation]
    const virtualPaper = {
      width: Math.round(paper.width * DEFAULT_QUALITY / INCH_TO_MM),
      height: Math.round(paper.height * DEFAULT_QUALITY / INCH_TO_MM)
    }

    const scale = {
      width: (display.width - 40) / virtualPaper.width,
      height: (display.height - 40) / virtualPaper.height
    }

    const displayScale = Math.min(scale.width, scale.height, 1)

    targetElement.classList.add('map-print-page')
    targetElement.style.width = `${virtualPaper.width}px`
    targetElement.style.height = `${virtualPaper.height}px`
    targetElement.style.transform = `translate(-50%, -50%) scale(${displayScale})`
    targetElement.style.boxShadow = '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
    targetElement.style.padding = ['top', 'right', 'bottom', 'left'].reduce((acc, current) => {
      return `${acc} ${Math.round(paddings[printSettings.targetFormat][current] * displayScale * DEFAULT_QUALITY / INCH_TO_MM)}px`
    }, '')

    map.updateSize()
    const viewResolution = printSettings.scale / getPointResolution(map.getView().getProjection(), DEFAULT_QUALITY / INCH_TO_MM, map.getView().getCenter())
    map.getView().setResolution(viewResolution)
  }

  const removePrintStyling = targetElement => {
    targetElement.classList.remove('map-print-page')
    targetElement.style = {}
  }

  const setOLOverlaysDisplayStyle = style => {
    const overlays = document.getElementsByClassName('map-overlay')
    for (const overlay of overlays) {
      overlay.style.display = style
    }
  }

  const executePrint = async (map, settings) => {
    const coordinatesFormat = await services.preferencesStore.get('coordinates-format', 'MGRS')
    /*
      Add some temporary marker on the SW/NE corner of the map.
      Currently this is only available if the coordinats format is MGRS
    */
    const printMarker = new Marker(map)
    const markerCoordinates = printMarker.add(coordinatesFormat)
    map.renderSync()

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
      const dateTimeOfPrinting = militaryFormat.now()
      const canvasDataUrl = canvas.toDataURL()
      if (settings.targetFormat === 'PNG') {
        const link = document.createElement('a')
        link.download = `ODINv2-MAP-${dateTimeOfPrinting}.png`
        link.href = canvasDataUrl
        link.click()
        link.remove()
        return
      }

      const text = {
        H1Left: settings.title,
        H1Right: `1:${settings.scale}000`,
        H2Left: `SW: ${markerCoordinates.sw} / NE: ${markerCoordinates.ne}`,
        H2Right: dateTimeOfPrinting
      }
      await toPDF(canvasDataUrl, { ...settings, pdfFileName: `ODINv2-MAP-${dateTimeOfPrinting}.pdf`, text })
    } catch (err) {
      // FIXME: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
      console.error('print', err.message)
    } finally {
      printMarker.remove()
      canvas?.remove()
    }
  }

  services.emitter.on('TOOLBAR_SCOPE/:scope', ({ scope }) => {

    const doPrint = function () { executePrint(map, printSettings) }
    const updatePrintSettings = function (settings) { printSettings = settings; resizeVirtualPaper() }

    if (scope === 'PRINT') {
      setZoomInteractions(map, false)
      setOLOverlaysDisplayStyle('none')

      services.emitter.on('PRINTSETTINGS', updatePrintSettings)
      services.emitter.on('PRINT', doPrint)

      window.addEventListener('resize', resizeVirtualPaper)
      resizeVirtualPaper()

    } else if (scope === 'STANDARD') {
      setZoomInteractions(map, true)

      services.emitter.removeAllListeners('PRINT')
      services.emitter.removeAllListeners('PRINTSETTINGS')

      window.removeEventListener('resize', resizeVirtualPaper)
      const targetElement = document.getElementById('map-container')
      removePrintStyling(targetElement)
      setOLOverlaysDisplayStyle(null)
    }
  })
}

export default print
