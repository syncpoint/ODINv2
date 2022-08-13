import { index } from '../symbology/2525c'

export const importSymbols = async db => {
  const id = symbol => `symbol:${symbol.sidc.substring(0, 10)}`
  const ops = Object.values(index).map(symbol => {
    symbol.id = id(symbol)
    return { type: 'put', key: symbol.id, value: symbol }
  })

  await db.batch(ops)
}
