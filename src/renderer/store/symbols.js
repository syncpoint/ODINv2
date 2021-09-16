import { index, format } from '../symbology/2525c'
import { url } from '../symbology/symbol'

export const importSymbols = async db => {
  const id = symbol => `symbol:${symbol.sidc.substring(0, 10)}`
  const ops = Object.values(index).map(symbol => {
    symbol.id = id(symbol)
    return { type: 'put', key: symbol.id, value: symbol }
  })

  await db.batch(ops)

  Object.values(index).reduce((acc, symbol) => {
    // Eager cache symbol images in symbol cache.
    const sidc = format(symbol.sidc, {
      identity: 'F', // friendly
      status: 'P' // present
    })

    acc[sidc] = url(sidc)
    return acc
  }, {})
}
