import paddings from './paddings'
import paperSizes from './paperSizes.json'
import { jsPDF } from 'jspdf'
import RobotoMediumFont from './Roboto-Medium'


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
  pdfDocument.addFileToVFS('RobotoMedium.ttf', RobotoMediumFont)
  pdfDocument.addFont('RobotoMedium.ttf', 'RobotoMedium', 'normal')
  pdfDocument.setFont('RobotoMedium')

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

  pdfDocument.setDocumentProperties({
    title: settings.title,
    keywords: 'C2IS, ODIN',
    creator: 'ODINv2 Open Source C2IS © Syncpoint Gmbh'
  })
  pdfDocument.addImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAHDCAYAAABS7KJ9AAABgmlDQ1BzUkdCIElFQzYxOTY2LTIuMQAAKJF1kb9LQlEUxz+aYZRlUENDg4Q1WZhB1BKkRAUSYgb9WvT5K1B7vKeEtAatQkHU0q+h/oJag+YgKIogmhqai1pKXudpYESey7nnc7/3nsO954I1klGyus0L2VxeC0/6XfMLiy77MzactDGILaro6ngoFKSufdxhMeNNv1mr/rl/rSWe0BWwNAmPKaqWF54SDq7lVZO3hTuVdDQufCrs0eSCwremHqvyi8mpKn+ZrEXCAbC2C7tSvzj2i5W0lhWWl+POZgrKz33MlzgSublZiT3i3eiEmcSPi2kmCDAsXRmVeZh+fAzIijr53kr+DKuSq8isUkRjhRRp8nhELUj1hMSk6AkZGYpm///2VU8O+arVHX5ofDKMt16wb0G5ZBifh4ZRPoKGR7jI1fJXD2DkXfRSTXPvg3MDzi5rWmwHzjeh60GNatGK1CBuTSbh9QRaF6DjGpqXqj372ef4HiLr8lVXsLsHfXLeufwNMLpnzXd+SfkAAAAJcEhZcwAACxMAAAsTAQCanBgAACAASURBVHic7d13dFTV2gbwZ08SepGm9CJFUOwFAem9g3QQpAkIkpBC6KEqIgkhFKWJ5V7r1Wv32j4Ltmu5gCjSRJAaeocgyezvj5mhZQKBMzPvPmee31pZ9y6RzLMkzPvMPvvsAxAREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREFmJIOQEREZtFa5wVwnffroFLqgHAkCgIWACKiMKW1jgJQC8AdAG6/4H9LXPKvpgP4FcDbAF5QSp0MZU4KDhYAIqIwoLUuBs9w9w36OwDcDCDPVX6rwwCWAJjJImBvLABERA6itVYAKuP8kPcN/EoBfqnfAXRVSm0I8PelEGEBICKyKa11PgC34OJP9bcDKBKiCCcB9FBKfRii16MAYgEgIrIBrXUpZB/0tQBESOYCcAJAHaXU78I56CqxABARGURr7QJQDRcv398BoKxkrivYDOA+pdQR6SCUeywARERCtNYFAdTG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',
    'PNG',
    paper.width - 15,
    paper.height - 15,
    10,
    10
  )

  return pdfDocument.save(settings.pdfFileName || 'ODINv2-MAP.pdf', { returnPromise: true })
}

export default toPDF
