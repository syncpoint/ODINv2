import * as R from 'ramda'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import projections from './epsg.json'

projections.forEach(projection => {
  proj4.defs(projection.code, projection.definition)
})

// Register all 60 N/S UTM zones with proj4:
;(() => R.range(1, 61).forEach(i => {
  proj4.defs(`EPSG:${32600 + i}`, `+proj=utm +zone=${i} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`)
  proj4.defs(`EPSG:${32700 + i}`, `+proj=utm +zone=${i} +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs`)
}))()


/* make projections available to OL */
register(proj4)
