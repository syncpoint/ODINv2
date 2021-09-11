import ms from 'milsymbol'
import './extension'
import urls from './urls.json'

const cache = urls
cache.placeholder = new ms.Symbol('').asCanvas().toDataURL()

export const url = sidc => {
  if (!cache[sidc]) {
    const symbol = new ms.Symbol(sidc)
    if (!symbol.isValid()) return cache._
    cache[sidc] = symbol.asCanvas().toDataURL()
  }

  return cache[sidc]
}
