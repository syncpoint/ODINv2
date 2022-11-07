import { MouseWheelZoom, PinchZoom, DragZoom, KeyboardZoom } from 'ol/interaction'
import { getPointResolution } from 'ol/proj'
import { militaryFormat } from '../../../shared/datetime'
import paperSizes from './paperSizes.json'


import { jsPDF } from 'jspdf'

const DEFAULT_PAPER_SIZE = 'a4'
const DEFAULT_ORIENTATION = 'landscape'
const DEFAULT_SCALE = '25'
const DEFAULT_QUALITY = 96 * 1.5 // dpi
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
    scale: options.scale || DEFAULT_SCALE
  }

  const resizeVirtualPaper = () => {

    const paper = paperSizes[printSettings.paperSize][printSettings.orientation]
    const targetElement = document.getElementById('map-container')

    const display = targetElement.parentElement.getBoundingClientRect()

    const virtualPaper = {
      width: Math.round(paper.width * DEFAULT_QUALITY / INCH_TO_MM),
      height: Math.round(paper.height * DEFAULT_QUALITY / INCH_TO_MM)
    }

    const scale = {
      width: (display.width - 40) / virtualPaper.width,
      height: (display.height - 40) / virtualPaper.height
    }

    const displayScale = Math.min(scale.width, scale.height, 1)

    const padding = Math.round(5 * displayScale * DEFAULT_QUALITY / INCH_TO_MM)

    targetElement.classList.add('map-print-page')
    targetElement.style.width = `${virtualPaper.width}px`
    targetElement.style.height = `${virtualPaper.height}px`
    targetElement.style.transform = `translate(-50%, -50%) scale(${displayScale})`
    targetElement.style.boxShadow = '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
    targetElement.style.padding = `${padding * 4}px ${padding}px ${padding}px ${padding}px`

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

  const executePrint = async (map, settings, toFile = false) => {
    console.log('... printing ...')

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
      if (toFile) {
        const link = document.createElement('a')
        link.download = 'map.png'
        link.href = url
        link.click()
        setTimeout(() => link.remove(), 300)
      }

      // eslint-disable-next-line new-cap
      const pdfDocument = new jsPDF({
        format: settings.paperSize,
        orientation: settings.orientation
      })

      const paper = paperSizes[settings.paperSize][settings.orientation]
      const padding = {
        left: 5,
        right: 5,
        top: 20,
        bottom: 5
      }
      const content = {
        x: padding.left,
        y: padding.top,
        w: paper.width - (padding.left + padding.right),
        h: paper.height - (padding.bottom + padding.top)
      }
      pdfDocument.addImage(url, 'PNG', content.x, content.y, content.w, content.h, '')
      pdfDocument.rect(content.x, content.y, content.w, content.h)

      const dateTimeOfPrinting = militaryFormat.now()

      // scale text in the upper right corner of the header
      const scaleText = `1 : ${settings.scale}000`
      pdfDocument.text(scaleText, (paper.width - padding.right), padding.top - Math.floor(padding.top / 2), { align: 'right' })

      // date/time of printing in the upper left corner of the header
      pdfDocument.text(dateTimeOfPrinting, padding.left, padding.top - Math.floor(padding.top / 2))

      // place center of map coordinates in the upper left corner of the header
      /* const centerAsLonLat = toLonLat(centerCoordinates, map.getView().getProjection())
      pdfDocument.text(coordinateFormat.format({ lng: centerAsLonLat[0], lat: centerAsLonLat[1] }), padding.left, padding.top - 2)
 */
      // scale bar lower left corner ON THE map
      const scaleBarHeight = 2
      const scaleBarSegmentWidth = 10
      pdfDocument.setDrawColor(0, 0, 0)

      pdfDocument.setFillColor(255, 255, 255)
      pdfDocument.rect(
        padding.left + scaleBarHeight / 2,
        paper.height - padding.bottom - 2.5 * scaleBarHeight,
        5.25 * scaleBarSegmentWidth,
        2 * scaleBarHeight,
        'FD'
      )

      // white segments
      pdfDocument.setFillColor(255, 255, 255)
      pdfDocument.rect(padding.left + scaleBarHeight, paper.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')
      pdfDocument.rect(padding.left + scaleBarHeight + 2 * scaleBarSegmentWidth, paper.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')

      // red segments
      pdfDocument.setFillColor(255, 0, 0)
      pdfDocument.rect(padding.left + scaleBarHeight + scaleBarSegmentWidth, paper.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')
      pdfDocument.rect(padding.left + scaleBarHeight + 3 * scaleBarSegmentWidth, paper.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')

      // real length of scale bar in (k)m
      const realLifeLength = settings.scale * 0.04
      pdfDocument.setFontSize(scaleBarHeight * 4)
      pdfDocument.text(`${realLifeLength < 1 ? realLifeLength * 1000 : realLifeLength}${realLifeLength >= 1 ? 'k' : ''}m`,
        padding.left + 4 * scaleBarSegmentWidth + 2 * scaleBarHeight,
        paper.height - padding.bottom - scaleBarHeight
      )

      // ---

      await pdfDocument.save(`ODINv2-MAP-${dateTimeOfPrinting}.pdf`, { returnPromise: true })
    } catch (err) {
      // FIXME: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
      console.error('print', err.message)
    } finally {
      canvas.remove()
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
