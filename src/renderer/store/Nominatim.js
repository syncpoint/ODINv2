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


/**
 *
 */
const Strategy = {

  /**
   * Remove recent, non-sticky result.
   */
  nonSticky: store => async places => {
    const removals = (await store.tuples('sticky+place:'))
      .filter(([/* key */, sticky]) => !sticky)
      .flatMap(([key]) => [
        { type: 'del', key },
        { type: 'del', key: ID.associatedId(key) }
      ])

    const additions = places.flatMap(([key, value]) => {
      return [
        { type: 'put', key, value },
        { type: 'put', key: ID.stickyId(key), value: false }
      ]
    })

    await store.import(removals.concat(additions))
  },

  /**
   * Keep result forever.
   */
  sticky: store => async places => {
    const additions = places.map(([key, value]) => ({ type: 'put', key, value }))
    await store.import(additions.concat(additions))
  }
}


/**
 *
 */
export default function Nominatim (store) {
  this.strategy = Strategy.sticky(store)
  this.url = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search'
}

Nominatim.prototype.sync = async function (query) {
  if (!query) return
  if (query === this.lastQuery) return
  this.lastQuery = query

  const response = await this.request(query)

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

  const places = response.map(R.compose(place, pretty))
  await this.strategy(places)
}

Nominatim.prototype.request = function (query) {
  const options = {
    format: 'json',
    dedupe: 1,
    polygon_geojson: 1,
    limit: 20
  }

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

    const params = new URLSearchParams(options)
    params.append('q', query)

    const url = `${this.url}?${params}`
    const async = true
    xhr.open('GET', url, async)
    xhr.setRequestHeader('Accept-Language', 'de')
    xhr.send()
  })
}
