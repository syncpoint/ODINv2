import * as R from 'ramda'

export const defs = proj4 => {

  console.log(proj4)

  predef.forEach(projection => {
    proj4.defs(projection.code, projection.definition)
  })

  // TODO: remove once updated to proj4 v2.15.0+
  // Register all 60 N/S UTM zones with proj4:
  R.range(1, 61).forEach(i => {
    proj4.defs(`EPSG:${32600 + i}`, `+proj=utm +zone=${i} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`)
    proj4.defs(`EPSG:${32700 + i}`, `+proj=utm +zone=${i} +ellps=WGS84 +datum=WGS84 +units=m +no_defs  +south`)
  })

  return proj4
}

const predef = [
  {
    name: 'MGI / Austria Lambert',
    code: 'EPSG:31287',
    definition: '+proj=lcc +lat_1=49 +lat_2=46 +lat_0=47.5 +lon_0=13.33333333333333 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI (Ferro) / Austria GK West Zone',
    code: 'EPSG:31251',
    definition: '+proj=tmerc +lat_0=0 +lon_0=28 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +pm=ferro +units=m +no_defs'
  },
  {
    name: 'MGI (Ferro) / Austria GK Central Zone',
    code: 'EPSG:31252',
    definition: '+proj=tmerc +lat_0=0 +lon_0=31 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +pm=ferro +units=m +no_defs'
  },
  {
    name: 'MGI (Ferro) / Austria GK East Zone',
    code: 'EPSG:31253',
    definition: '+proj=tmerc +lat_0=0 +lon_0=34 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +pm=ferro +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK West',
    code: 'EPSG:31254',
    definition: '+proj=tmerc +lat_0=0 +lon_0=10.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK Central',
    code: 'EPSG:31255',
    definition: '+proj=tmerc +lat_0=0 +lon_0=13.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK East',
    code: 'EPSG:31256',
    definition: '+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK M28',
    code: 'EPSG:31257',
    definition: '+proj=tmerc +lat_0=0 +lon_0=10.33333333333333 +k=1 +x_0=150000 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK M31',
    code: 'EPSG:31258',
    definition: '+proj=tmerc +lat_0=0 +lon_0=13.33333333333333 +k=1 +x_0=450000 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'MGI / Austria GK M34',
    code: 'EPSG:31259',
    definition: '+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=750000 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
  },
  {
    name: 'CH1903 / LV03 -- Swiss CH1903 / LV03',
    code: 'EPSG:21781',
    definition: '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs'
  }
]
