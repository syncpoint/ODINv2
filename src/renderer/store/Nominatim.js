import * as R from 'ramda'
import { reproject } from 'reproject'
import * as ID from '../ids'

/* eslint-disable */
// XMLHttpRequest.readyState.
const UNSENT           = 0 // Client has been created. open() not called yet.
const OPENED           = 1 // open() has been called.
const HEADERS_RECEIVED = 2 // send() has been called, and headers and status are available.
const LOADING          = 3 // Downloading; responseText holds partial data.
const DONE             = 4 // The operation is complete.
/* eslint-enable */

export default function Nominatim (store) {
  this.store = store
  this.options = {
    formal: 'json',
    dedupe: 1,
    polygon_geojson: 1,
    limit: 20
  }
}

Nominatim.prototype.sync = async function (query) {
  if (!query) return
  if (query === this.lastQuery) return
  this.lastQuery = query

  console.log('[Nominatim]/sync', query)
  const response = await this.request(query)

  const place = entry => {
    const parts = entry.display_name.split(', ')
    return [
      `place:${entry.osm_id}`,
      {
        name: R.head(parts),
        description: R.tail(parts).join(', '),
        ...entry
      }
    ]
  }

  // Remove all non-sticky places.
  //
  const removals = (await this.store.tuples('sticky+place:'))
    .filter(([/* key */, sticky]) => !sticky)
    .flatMap(([key, value]) => [
      { type: 'del', key },
      { type: 'del', key: ID.associatedId(key) }
    ])

  const pretty = ({ geojson, type, ...place }) => {
    const clazz = place.class
    delete place.class
    const tags = [clazz, type].filter(R.identity)
    return {
      ...place,
      type: 'Feature',
      tags,
      geometry: reproject(geojson, 'EPSG:4326', 'EPSG:3857')
    }
  }

  const places = response
    .map(pretty)
    .map(place)

  const additions = places.flatMap(([key, value]) => {
    return [
      { type: 'put', key, value },
      { type: 'put', key: ID.stickyId(key), value: false }
    ]
  })

  const operations = removals.concat(additions)
  this.store.import(operations)
}

Nominatim.prototype.request = function (query) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', async event => {
      const request = event.target

      switch (request.readyState) {
        case DONE: {
          try {
            const entries = JSON.parse(request.responseText)
            resolve(entries)
          } catch (err) {
            reject(err)
          }
        }
      }
    })

    const params = Object.entries(this.options)
      .reduce((acc, [key, value]) => acc.concat([`${key}=${value}`]), ['format=json'])
      .join('&')

    const url = `https://nominatim.openstreetmap.org/search/${query}?${params}`
    const async = true
    xhr.open('GET', url, async)
    xhr.setRequestHeader('Accept-Language', 'de')
    xhr.send()
  })
}
