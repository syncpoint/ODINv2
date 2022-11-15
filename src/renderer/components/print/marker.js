import { getTopRight, getBottomLeft } from 'ol/extent'
import { toLonLat, fromLonLat } from 'ol/proj'
import Mgrs, { LatLon } from 'geodesy/mgrs.js'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Stroke, Style, Text as TextStyle, RegularShape } from 'ol/style'
import { Feature } from 'ol'
import { Point } from 'ol/geom'

const printMarkerStyle = (directions = [0, 1], text, textOffsetX, textOffsetY) => {
  const radius = 20
  const stroke = new Stroke({ color: 'black', width: 2 })

  return [
    ...directions.map(direction => new Style({
      image: new RegularShape({
        stroke,
        rotation: direction * Math.PI / 2,
        points: 2,
        radius: radius / 2,
        displacement: [0, 0.6 * radius]
      }),
      text: new TextStyle({
        font: '16px sans-serif',
        text,
        offsetX: textOffsetX,
        offsetY: textOffsetY
      })
    }))]
}

const formatters = {
  MGRS: ([lng, lat], digits) => new LatLon(lat, lng).toUtm().toMgrs().toString(digits)
}

const process = (coordinates, summand = 0) => {
  const point = coordinates.split(' ')
  const easting = ((summand + parseInt(point[2])) * 1000).toString()
  const northing = ((summand + parseInt(point[3])) * 1000).toString()
  return `${point[0]} ${point[1]} ${easting.padStart(5, '0')} ${northing.padStart(5, '0')}`
}


export const Marker = function (map) {
  this.map = map
  this.markerSource = new VectorSource()
  this.markerLayer = new VectorLayer({
    source: this.markerSource
  })

  map.addLayer(this.markerLayer)
}

Marker.prototype.addMGRSMarker = function () {
  const view = this.map.getView()
  const extent = view.calculateExtent(this.map.getSize())
  const projection = view.getProjection()

  const m = {
    sw: formatters.MGRS(toLonLat(getBottomLeft(extent), projection), 4),
    ne: formatters.MGRS(toLonLat(getTopRight(extent), projection), 4)
  }
  // adjust coordinates in order to match the MGRS grid of the 50k map
  const p = {
    sw: process(m.sw, 1),
    ne: process(m.ne, 0)
  }

  const toPointGeometry = mgrs => {
    const pointCoordinates = Mgrs.parse(mgrs).toUtm().toLatLon()
    const olCoordinates = fromLonLat([pointCoordinates.lon, pointCoordinates.lat])
    const point = new Point(olCoordinates)
    return point
  }

  const features = []
  const sw = new Feature({
    geometry: toPointGeometry(p.sw)
  })
  sw.setStyle(printMarkerStyle([0, 1, 2, 3], 'SW', -20, 20))
  features.push(sw)

  const ne = new Feature({
    geometry: toPointGeometry(p.ne)
  })
  ne.setStyle(printMarkerStyle([0, 1, 2, 3], 'NE', 20, -16))
  features.push(ne)

  this.markerSource.addFeatures(features)

  return p
}

Marker.prototype.removeMGRSMarker = function () {
  this.map.removeLayer(this.markerLayer)
  this.markerLayer.dispose()
  this.markerSource.dispose()
}

