import * as R from 'ramda'

/** 2525C, table TABLE XIII */
const schemes = {
  dark: {
    red: '#C80000', // RGB(200, 0, 0)
    blue: '#006B8C', // RGB(0, 107, 140)
    green: '#00A000', // RGB(0, 160, 0)
    yellow: '#E1DC00', // RGB(225, 220, 0)
    purple: '#500050' // RGB(80, 0, 80)
  },
  medium: {
    red: '#FF3031', // RGB(255, 48, 49)
    blue: '#00A8DC', // RGB(0, 168, 220)
    green: '#00E200', // RGB(0, 226, 0)
    yellow: '#FFFF00', // RGB(255, 255, 0)
    purple: '#800080' // RGB(128, 0, 128)
  },
  light: {
    red: '#FF8080', // RGB(255, 128, 128)
    blue: '#80E0FF', // RGB(128, 224, 255)
    green: '#AAFFAA', // RGB(170, 255, 170)
    yellow: '#FFFF80', // RGB(255, 255, 128)
    purple: '#FFA1FF' // RGB(255, 161, 255)
  }
}

const includes = xs => x => xs.includes(x)

/**
 * @deprecated: use lineColor
 */
export const fill = scheme => R.cond([
  [includes(['A', 'F', 'M', 'D']), R.always(schemes[scheme].blue)],
  [includes(['H', 'J', 'K', 'S']), R.always(schemes[scheme].red)],
  [includes(['N', 'L']), R.always(schemes[scheme].green)],
  [includes(['U', 'P', 'G', 'W']), R.always(schemes[scheme].yellow)],
  [R.T, R.always('black')]
])

/**
 * @deprecated: use lineHaloColor
 */
export const stroke = R.cond([
  [R.equals('-'), R.always('white')],
  [R.T, R.always('black')]
])

export const lineColor = scheme => R.cond([
  [includes(['A', 'F', 'M', 'D']), R.always(schemes[scheme].blue)],
  [includes(['H', 'J', 'K', 'S']), R.always(schemes[scheme].red)],
  [includes(['N', 'L']), R.always(schemes[scheme].green)],
  [includes(['U', 'P', 'G', 'W']), R.always(schemes[scheme].yellow)],
  [R.T, R.always('black')]
])

export const lineHaloColor = R.cond([
  [R.equals('-'), R.always('white')],
  [R.T, R.always('black')]
])

