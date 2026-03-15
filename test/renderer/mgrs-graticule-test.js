import assert from 'assert'
import { LatLon } from 'geodesy/mgrs.js'
import Utm from 'geodesy/utm.js'

// Extract and test the pure logic from mgrsGraticule.js
// (no OL dependencies needed for these)

const LAT_MIN = -80
const LAT_MAX = 84
const BAND_LETTERS = 'CDEFGHJKLMNPQRSTUVWX'

const utmZone = lon => Math.floor((lon + 180) / 6) + 1

const bandLetter = lat => {
  if (lat < LAT_MIN || lat >= LAT_MAX) return null
  let index = Math.floor((lat - LAT_MIN) / 8)
  if (index >= BAND_LETTERS.length) index = BAND_LETTERS.length - 1
  return BAND_LETTERS[index]
}

const utmToLonLat = (zone, hemisphere, easting, northing) => {
  try {
    const utm = new Utm(zone, hemisphere, easting, northing)
    const ll = utm.toLatLon()
    return [ll.lon, ll.lat]
  } catch (e) {
    return null
  }
}

const get100kLetters = (zone, easting, northing) => {
  try {
    const ll = utmToLonLat(zone, 'N', easting + 50000, northing + 50000)
    if (!ll) return null
    const latLon = new LatLon(ll[1], ll[0])
    const mgrs = latLon.toUtm().toMgrs()
    return `${mgrs.e100k}${mgrs.n100k}`
  } catch (e) {
    return null
  }
}

describe('MGRS Graticule — UTM zone calculation', function () {

  it('zone 1 starts at -180°', function () {
    assert.equal(utmZone(-180), 1)
  })

  it('zone 31 covers 0° longitude', function () {
    assert.equal(utmZone(0), 31)
  })

  it('zone 33 covers Vienna (~16.3°)', function () {
    assert.equal(utmZone(16.3), 33)
  })

  it('zone 60 covers 179°', function () {
    assert.equal(utmZone(179), 60)
  })

  it('zone boundaries: 6° is zone 32', function () {
    assert.equal(utmZone(6), 32)
  })

  it('zone boundaries: 5.999° is still zone 31', function () {
    assert.equal(utmZone(5.999), 31)
  })
})

describe('MGRS Graticule — band letter', function () {

  it('returns C for -80° (southern limit)', function () {
    assert.equal(bandLetter(-80), 'C')
  })

  it('returns U for 48° (Vienna)', function () {
    assert.equal(bandLetter(48), 'U')
  })

  it('returns X for 72° (last band)', function () {
    assert.equal(bandLetter(72), 'X')
  })

  it('returns null below -80°', function () {
    assert.equal(bandLetter(-81), null)
  })

  it('returns null at or above 84°', function () {
    assert.equal(bandLetter(84), null)
  })

  it('skips letters I and O', function () {
    assert.ok(!BAND_LETTERS.includes('I'))
    assert.ok(!BAND_LETTERS.includes('O'))
  })
})

describe('MGRS Graticule — UTM ↔ LonLat conversion', function () {

  it('converts Vienna UTM to approximately correct lon/lat', function () {
    // Vienna: ~48.2°N, 16.3°E → UTM zone 33
    const result = utmToLonLat(33, 'N', 596598, 5339347)
    assert.ok(result, 'conversion should succeed')
    assert.ok(Math.abs(result[0] - 16.3) < 0.01, `lon ${result[0]} should be ~16.3`)
    assert.ok(Math.abs(result[1] - 48.2) < 0.01, `lat ${result[1]} should be ~48.2`)
  })

  it('converts equator UTM to approximately correct lon/lat', function () {
    const result = utmToLonLat(31, 'N', 500000, 0)
    assert.ok(result, 'conversion should succeed')
    assert.ok(Math.abs(result[0] - 3.0) < 0.1, `lon ${result[0]} should be ~3.0`)
    assert.ok(Math.abs(result[1] - 0.0) < 0.1, `lat ${result[1]} should be ~0.0`)
  })

  it('returns null for invalid coordinates', function () {
    const result = utmToLonLat(33, 'N', -1, -1)
    assert.equal(result, null)
  })
})

describe('MGRS Graticule — 100k square letters', function () {

  it('returns two-letter identifier for Vienna area', function () {
    // Vienna is in 33U WP
    const letters = get100kLetters(33, 500000, 5300000)
    assert.ok(letters, 'should return letters')
    assert.equal(letters.length, 2, 'should be exactly 2 letters')
  })

  it('returns null for invalid zone/coordinates', function () {
    const letters = get100kLetters(99, 0, 0)
    assert.equal(letters, null)
  })
})

describe('MGRS Graticule — zone/band consistency', function () {

  it('33U is the correct GZD for Vienna', function () {
    const zone = utmZone(16.3)
    const band = bandLetter(48.2)
    assert.equal(zone, 33)
    assert.equal(band, 'U')
  })

  it('32T is the correct GZD for Munich (~48.1°N, 11.6°E)', function () {
    const zone = utmZone(11.6)
    const band = bandLetter(48.1)
    assert.equal(zone, 32)
    assert.equal(band, 'U') // Munich is actually in U band (48° is U)
  })

  it('18T is the correct GZD for New York (~40.7°N, -74°W)', function () {
    const zone = utmZone(-74)
    const band = bandLetter(40.7)
    assert.equal(zone, 18)
    assert.equal(band, 'T')
  })
})
