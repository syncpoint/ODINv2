import skkm from './skkm.json'

const parameterized = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const symbols = skkm.reduce((acc, descriptor) => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    parameterized: sidc,
    sidc: descriptor.sidc,
    class: descriptor.class,
    hierarchy: descriptor.hierarchy,
    dimensions: [],
    scope: 'SKKM',
    geometry: { type: 'Point' }
  }
  return acc
}, {})
