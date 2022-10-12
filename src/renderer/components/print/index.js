import paperSizes from './paperSizes.json'
import scale from './scale.json'
import { getPointResolution, toLonLat } from 'ol/proj'
import { jsPDF } from 'jspdf'

const DEFAULT_PAPER_SIZE = 'a4'
const DEFAULT_ORIENTATION = 'landscape'
// const DEFAULT_ORIENTATION = 'portrait'
const DEFAULT_SCALE = '25'
const DEFAULT_QUALITY = 96 * 2 // dpi
const INCH_TO_MM = 25.4

const print = ({ map, services }) => {

  const setSize = (params) => {

    const paperSize = paperSizes[DEFAULT_PAPER_SIZE][DEFAULT_ORIENTATION]
    const targetElement = document.getElementById('map-container')

    const displaySize = targetElement.parentElement.getBoundingClientRect()

    const pixelSize = {
      width: Math.round(paperSize.width * DEFAULT_QUALITY / INCH_TO_MM),
      height: Math.round(paperSize.height * DEFAULT_QUALITY / INCH_TO_MM)
    }

    const scale = {
      width: (displaySize.width - 40) / pixelSize.width,
      height: (displaySize.height - 40) / pixelSize.height
    }

    const displayScale = Math.min(scale.width, scale.height, 1)

    const padding = Math.round(5 * displayScale * DEFAULT_QUALITY / INCH_TO_MM)

    targetElement.classList.add('map-print-page')
    targetElement.style.width = `${pixelSize.width}px`
    targetElement.style.height = `${pixelSize.height}px`
    targetElement.style.transform = `translate(-50%, -50%) scale(${displayScale})`
    targetElement.style.boxShadow = '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
    targetElement.style.padding = `${padding * 4}px ${padding}px ${padding}px ${padding}px`

    map.updateSize()

    const viewResolution = DEFAULT_SCALE / getPointResolution(map.getView().getProjection(), DEFAULT_QUALITY / INCH_TO_MM, map.getView().getCenter())
    console.log('viewResolution', viewResolution)

    map.getView().setResolution(viewResolution)

    /* setTimeout(async () => {
      await print(map, paperSize, false)
      reset(targetElement)
      window.removeEventListener('resize', setSize)
    }, 15000) */
  }

  const reset = targetElement => {
    targetElement.classList.remove('map-print-page')
    targetElement.style = {}
  }

  const print = async (map, paperSize, toFile = false) => {

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
        format: DEFAULT_PAPER_SIZE,
        orientation: DEFAULT_ORIENTATION
      })

      pdfDocument.addImage(url, 'PNG', 5, 20, paperSize.width - 2 * 5, paperSize.height - 5 - 20, '')
      pdfDocument.rect(5, 20, paperSize.width - 2 * 5, paperSize.height - 5 - 20)
      await pdfDocument.save('map-NIDO.pdf', { returnPromise: true })
    } catch (err) {
    // FIXME: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
    // console.error('[PREVIEW]', err.message)
    } finally {
      canvas.remove()
    }

  }


  services.emitter.on('PRINT_MAP', () => {
    console.log('We should keep the state ...')

    window.addEventListener('resize', setSize)
    setSize()

  })
}

export default print
