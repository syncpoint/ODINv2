import ms from 'milsymbol'
import './extension'

const placeholderSymbol = new ms.Symbol('')

const cache = {
  _: placeholderSymbol.asCanvas().toDataURL()
}

export const url = sidc => {
  if (!cache[sidc]) {
    const symbol = new ms.Symbol(sidc)
    if (!symbol.isValid()) return cache._
    cache[sidc] = symbol.asCanvas().toDataURL()
  }

  return cache[sidc]
}
