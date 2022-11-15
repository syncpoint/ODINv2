import { militaryFormat } from '../../../shared/datetime'
import paddings from './paddings'
import paperSizes from './paperSizes.json'
import { jsPDF } from 'jspdf'

const toPDF = async (dataURL, settings) => {
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
  pdfDocument.text(settings.title,
    paddings[settings.targetFormat].left,
    paddings[settings.targetFormat].top - Math.floor(paddings[settings.targetFormat].top / 2),
    { maxWidth: paper.width - paddings[settings.targetFormat].left - paddings[settings.targetFormat].right }
  )

  // scale text in the upper right corner of the header
  const scaleText = `1: ${settings.scale}000`
  pdfDocument.text(scaleText,
    (paper.width - paddings[settings.targetFormat].right),
    paddings[settings.targetFormat].top - Math.floor(paddings[settings.targetFormat].top / 2),
    { align: 'right' }
  )

  pdfDocument.setFontSize(10)

  const dateTimeOfPrinting = militaryFormat.now()
  pdfDocument.text(
    dateTimeOfPrinting, paper.width - paddings[settings.targetFormat].right,
    paddings[settings.targetFormat].top - 2,
    { align: 'right' }
  )
  pdfDocument.text(
    settings.subtitle,
    paddings[settings.targetFormat].left,
    paddings[settings.targetFormat].top - 2
  )

  // scale bar lower left corner ON THE map
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

  return pdfDocument.save(`ODINv2-MAP-${dateTimeOfPrinting}.pdf`, { returnPromise: true })
}

export default toPDF
