import ms from 'milsymbol'
import * as MILSTD from '../symbology/2525c'
import './extension'

const defaultOptions = { size: 30 }

export const svg = (sidc, options = defaultOptions) => {
  if (!sidc) return null
  const symbol = sidc.match(/S.G.U/)
    ? new ms.Symbol(sidc, options) // keep echelon for units
    : new ms.Symbol(MILSTD.format(sidc, { echelon: '-' }), options)

  return symbol.asSVG()
}
