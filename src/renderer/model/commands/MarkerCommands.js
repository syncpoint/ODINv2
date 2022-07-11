import * as R from 'ramda'
import Mgrs from 'geodesy/mgrs.js'
import Utm from 'geodesy/utm.js'
import convert from 'geo-coordinates-parser' // DMS
import { fromLonLat } from 'ol/proj'
import { Command } from '../../commands/Command'
import { markerId } from '../../ids'

const extract = value => {
  if (value.lat && value.lon) return [value.lon, value.lat]
  else if (value.decimalLatitude && value.decimalLongitude) return [value.decimalLongitude, value.decimalLatitude]
  else if (value.latitudeCenter && value.longitudeCenter) return [value.longitudeCenter, value.latitudeCenter]
  else return undefined
}

const parsers = [
  s => Mgrs.parse(s).toUtm().toLatLon(),
  s => Utm.parse(s).toLatLon(),
  s => convert(s)
]


const parseCoordinate = s => parsers.reduce((acc, parse) => {
  return acc || R.tryCatch(R.compose(extract, parse))(R.F)(s)
}, undefined)

/**
 *
 */
export default function MarkerCommands (options) {
  this.store = options.store
  this.emitter = options.emitter
  this.selection = options.selection
}

MarkerCommands.prototype.commands = function (tuples) {
  return [
    this.createMarker(tuples)
  ]
}

MarkerCommands.prototype.createMarker = function () {
  const callback = value => {
    const replaced = value.replace(/[’′]/g, "'").replace(/[″]/g, '"')
    const coordinates = parseCoordinate(replaced)
    if (!coordinates) return

    const center = fromLonLat(coordinates)
    const feature = {
      name: value,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: center
      }
    }

    const id = markerId()
    this.store.insert([[id, feature]])
    this.emitter.emit('map/flyto', { center })
    this.selection.set([id])
  }

  return new Command({
    id: 'marker:create',
    description: 'Marker: Create new',
    body: (dryRun) => {
      if (dryRun) return
      const event = { value: '', callback, placeholder: 'Marker Coordinate' }
      this.emitter.emit('command/open-command-palette', event)
    }
  })
}
