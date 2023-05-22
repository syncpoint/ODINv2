import skkm from './skkm.json'

// FIXME: duplicate code
// E.g. 'GFGPOAO----****' (15) => 'G*G*OAO---' (10)
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
