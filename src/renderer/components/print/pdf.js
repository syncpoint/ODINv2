import paddings from './paddings'
import paperSizes from './paperSizes.json'
import { jsPDF } from 'jspdf'

const toPDF = async (dataURL, settings) => {
  /*
    settings may contain a text opject, that adresses 4 text areas in the header of the
    PDF document:

    "H1Left"        "H1Right"
    "H2Left"        "H2Right"

    H1 texts have a text size of 16px, H2 are 10px
    left is left aligned, right is right aligned
  */


  // eslint-disable-next-line new-cap
  const pdfDocument = new jsPDF({
    format: settings.paperSize,
    orientation: settings.orientation
  })

  const paper = paperSizes[settings.paperSize][settings.orientation]
  const content = {
    x: paddings[settings.targetFormat].left,
    y: paddings[settings.targetFormat].top,
    w: paper.width - (paddings[settings.targetFormat].left + paddings[settings.targetFormat].right),
    h: paper.height - (paddings[settings.targetFormat].bottom + paddings[settings.targetFormat].top)
  }
  pdfDocument.addImage(dataURL, 'PNG', content.x, content.y, content.w, content.h, '')
  pdfDocument.rect(content.x, content.y, content.w, content.h)

  /* Header Text */
  pdfDocument.text(settings.text?.H1Left,
    paddings[settings.targetFormat].left,
    paddings[settings.targetFormat].top - Math.floor(paddings[settings.targetFormat].top / 2),
    { maxWidth: paper.width - paddings[settings.targetFormat].left - paddings[settings.targetFormat].right }
  )
  pdfDocument.text(settings.text?.H1Right,
    (paper.width - paddings[settings.targetFormat].right),
    paddings[settings.targetFormat].top - Math.floor(paddings[settings.targetFormat].top / 2),
    { align: 'right' }
  )

  pdfDocument.setFontSize(10)
  pdfDocument.text(
    settings.text?.H2Left,
    paddings[settings.targetFormat].left,
    paddings[settings.targetFormat].top - 2
  )
  pdfDocument.text(
    settings.text?.H2Right,
    paper.width - paddings[settings.targetFormat].right,
    paddings[settings.targetFormat].top - 2,
    { align: 'right' }
  )

  /* scale bar lower left corner ON THE map */
  const scaleBarHeight = 2
  const scaleBarSegmentWidth = 10
  pdfDocument.setDrawColor(0, 0, 0)

  pdfDocument.setFillColor(255, 255, 255)
  pdfDocument.rect(
    paddings[settings.targetFormat].left + scaleBarHeight / 2,
    paper.height - paddings[settings.targetFormat].bottom - 2.5 * scaleBarHeight,
    5.25 * scaleBarSegmentWidth,
    2 * scaleBarHeight,
    'FD'
  )

  // white segments
  pdfDocument.setFillColor(255, 255, 255)
  pdfDocument.rect(
    paddings[settings.targetFormat].left + scaleBarHeight,
    paper.height - paddings[settings.targetFormat].bottom - 2 * scaleBarHeight,
    scaleBarSegmentWidth,
    scaleBarHeight,
    'FD'
  )
  pdfDocument.rect(
    paddings[settings.targetFormat].left + scaleBarHeight + 2 * scaleBarSegmentWidth,
    paper.height - paddings[settings.targetFormat].bottom - 2 * scaleBarHeight,
    scaleBarSegmentWidth,
    scaleBarHeight,
    'FD'
  )

  // red segments
  pdfDocument.setFillColor(255, 0, 0)
  pdfDocument.rect(
    paddings[settings.targetFormat].left + scaleBarHeight + scaleBarSegmentWidth,
    paper.height - paddings[settings.targetFormat].bottom - 2 * scaleBarHeight,
    scaleBarSegmentWidth,
    scaleBarHeight,
    'FD'
  )
  pdfDocument.rect(
    paddings[settings.targetFormat].left + scaleBarHeight + 3 * scaleBarSegmentWidth,
    paper.height - paddings[settings.targetFormat].bottom - 2 * scaleBarHeight,
    scaleBarSegmentWidth,
    scaleBarHeight,
    'FD'
  )

  // real length of scale bar in (k)m
  const realLifeLength = settings.scale * 0.04
  pdfDocument.setFontSize(scaleBarHeight * 4)
  pdfDocument.text(`${realLifeLength < 1 ? realLifeLength * 1000 : realLifeLength}${realLifeLength >= 1 ? 'k' : ''}m`,
    paddings[settings.targetFormat].left + 4 * scaleBarSegmentWidth + 2 * scaleBarHeight,
    paper.height - paddings[settings.targetFormat].bottom - scaleBarHeight
  )

  return pdfDocument.save(settings.pdfFileName || 'ODINv2-MAP.pdf', { returnPromise: true })
}

export default toPDF
