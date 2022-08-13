import ms from 'milsymbol'
import * as MILSTD from '../symbology/2525c'
import './extension'

export const svg = sidc => {
  if (!sidc) return null
  const options = { size: 30 }
  const symbol = sidc.match(/S.G.U/)
    ? new ms.Symbol(sidc, options) // keep echelon for units
    : new ms.Symbol(MILSTD.format(sidc, { echelon: '-' }), options)

  return symbol.asSVG()
}
