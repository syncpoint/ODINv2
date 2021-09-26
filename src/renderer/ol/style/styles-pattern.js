import { DEVICE_PIXEL_RATIO } from 'ol/has'
import { DEG2RAD } from '../../../shared/Math'

const patterns = {
  hatch: {
    width: 5,
    height: 5,
    lines: [[0, 2.5, 5, 2.5]]
  },
  cross: {
    width: 7,
    height: 7,
    lines: [[0, 3, 10, 3], [3, 0, 3, 10]]
  }
}

const patternDescriptor = options => {
  const d = Math.round(options.spacing) || 10
  const pattern = patterns[options.pattern]

  let a = Math.round(((options.angle || 0) - 90) % 360)
  if (a > 180) a -= 360
  a *= DEG2RAD
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  if (Math.abs(sin) < 0.0001) {
    pattern.width = pattern.height = d
    pattern.lines = [[0, 0.5, d, 0.5]]
    pattern.repeat = [[0, 0], [0, d]]
  } else if (Math.abs(cos) < 0.0001) {
    pattern.width = pattern.height = d
    pattern.lines = [[0.5, 0, 0.5, d]]
    pattern.repeat = [[0, 0], [d, 0]]
    if (options.pattern === 'cross') {
      pattern.lines.push([0, 0.5, d, 0.5])
      pattern.repeat.push([0, d])
    }
  } else {
    const w = pattern.width = Math.round(Math.abs(d / sin)) || 1
    const h = pattern.height = Math.round(Math.abs(d / cos)) || 1
    if (options.pattern === 'cross') {
      pattern.lines = [[-w, -h, 2 * w, 2 * h], [2 * w, -h, -w, 2 * h]]
      pattern.repeat = [[0, 0]]
    } else if (cos * sin > 0) {
      pattern.lines = [[-w, -h, 2 * w, 2 * h]]
      pattern.repeat = [[0, 0], [w, 0], [0, h]]
    } else {
      pattern.lines = [[2 * w, -h, -w, 2 * h]]
      pattern.repeat = [[0, 0], [-w, 0], [0, h]]
    }
  }
  pattern.stroke = options.size === 0 ? 0 : options.size || 4
  return pattern
}

export const fill = options => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const descriptor = patternDescriptor(options)

  canvas.width = Math.round(descriptor.width * DEVICE_PIXEL_RATIO)
  canvas.height = Math.round(descriptor.height * DEVICE_PIXEL_RATIO)
  context.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO)
  context.lineCap = 'round'

  ;[
    [options.strokeColor, options.strokeWidth],
    [options.strokeFillColor, options.strokeFillWidth]
  ].forEach(([strokeStyle, lineWidth]) => {
    context.lineWidth = lineWidth
    context.strokeStyle = strokeStyle
    const repeat = descriptor.repeat || [[0, 0]]

    if (descriptor.lines) {
      for (let i = 0; i < descriptor.lines.length; i++) {
        for (let r = 0; r < repeat.length; r++) {
          const line = descriptor.lines[i]
          context.beginPath()
          context.moveTo(line[0] + repeat[r][0], line[1] + repeat[r][1])
          for (let k = 2; k < line.length; k += 2) {
            context.lineTo(line[k] + repeat[r][0], line[k + 1] + repeat[r][1])
          }
          context.stroke()
        }
      }
    }
  })

  return context.createPattern(canvas, 'repeat')
}
