import { Symbol } from '@syncpoint/signs'
import * as MILSTD from '../symbology/2525c'

const defaultOptions = { size: 30 }

const format = sidc => sidc.match(/S.G.U/)
  ? sidc // // keep echelon for units
  : MILSTD.format(sidc, { echelon: '-' })

export const svg = (sidc, options = defaultOptions) => {
  if (!sidc) return null
  const symbol = new Symbol(format(sidc), options) 
  return symbol.asSVG()
}
