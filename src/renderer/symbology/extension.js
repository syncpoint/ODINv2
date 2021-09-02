import ms from 'milsymbol'
import symbols from './extension.json'

;(() => {
  const parts = Object.keys(symbols.iconParts)
  ms.addIconParts((iconParts, metadata, colors, std2525, monoColor, alternateMedal) => {
    parts.forEach(part => {
      iconParts[part] = addIconParts(symbols.iconParts[part], '#333')
    })
  })
  ms.addSIDCicons((sidc, bbox, iconParts, std2525) => {
    const sidcs = Object.keys(symbols.lettersidc)
    sidcs.forEach(sidcKey => {
      const parts = []
      symbols.lettersidc[sidcKey].forEach(partKey => {
        parts.push(iconParts[partKey])
      })
      bbox[sidcKey] = { x1: 0, x2: 200, y1: 0, y2: 200 }
      sidc[sidcKey] = parts
    })
  }, 'letter')
})()

const addIconParts = (parent, iconFillColor) => {
  const parts = [
    ...generatePath(parent, iconFillColor),
    ...generateCircles(parent, iconFillColor),
    ...generateTexts(parent, iconFillColor)
  ]
  return parts
}

const generatePath = (parent, iconFillColor) => {
  const parts = []
  if (parent.paths) {
    parent.paths.forEach(path => {
      try {
        const content = {
          type: 'path',
          d: path.d, // SVG path data
          fill: path.fill || false, // Fill color  or set to false if none
          fillopacity: path.fillopacity || 1.0, // Fill opacity {Optional}
          stroke: path.stroke || iconFillColor, // Stroke color  or set to false if none
          strokedasharray: path.strokedasharray, // {Optional}
          strokewidth: path.strokewidth || 3 // Width of the stroke {Optional}
        }
        if (content.fill) {
          content.fill = replaceColor(content.fill, iconFillColor)
        }
        parts.push(content)
      } catch (error) {
        console.error('error with transforming a path' + error)
      }
    })
  }
  return parts
}

const generateCircles = (parent, iconFillColor) => {
  const parts = []
  if (parent.circles) {
    parent.circles.forEach(circle => {
      try {
        const content = {
          type: 'circle',
          cx: circle.cx, // Center x
          cy: circle.cy, // Center y
          r: circle.r, // Radius
          fill: circle.fill, // Fill color  or set to false if none
          fillopacity: circle.fillopacity, // Fill opacity {Optional}
          stroke: circle.stroke, // Stroke color  or set to false if none
          strokedasharray: circle.strokedasharray, // {Optional}
          strokewidth: circle.strokewidth // Width of the stroke {Optional}
        }
        if (content.fill) {
          content.fill = replaceColor(content.fill, iconFillColor)
        }
        parts.push(content)
      } catch (error) {
        console.error('error with transforming a circle' + error)
      }
    })
  }
  return parts
}

const generateTexts = (parent, iconFillColor) => {
  const parts = []
  if (parent.texts) {
    parent.texts.forEach(text => {
      try {
        const content = {
          type: 'text',
          text: text.text,
          x: text.x || 100, // x position
          y: text.y || 100, // y position
          textanchor: text.textanchor || 'middle', // anchor
          fontsize: text.fontsize || 38,
          fontfamily: text.fontfamily || 'Arial',
          fontweight: text.fontweight,
          fill: text.fill || 'none', // Fill color or set to false if none
          fillopacity: text.fillopacity, // Fill opacity {Optional}
          stroke: text.stroke || '#000', // Stroke color  or set to false if none
          strokedasharray: text.strokedasharray, // {Optional}
          strokewidth: text.strokewidth // Width of the stroke {Optional}
        }
        if (content.stroke) {
          content.stroke = replaceColor(content.stroke, iconFillColor)
        }
        parts.push(content)

      } catch (error) {
        console.error('error with transforming a text' + error)
      }
    })
  }
  return parts
}

const replaceColor = (colorString, hostilityColor) => {
  const black = '#000000'
  const shortBlack = '#000'
  if (colorString !== black && colorString !== shortBlack) {
    return hostilityColor
  }
  return colorString
}
