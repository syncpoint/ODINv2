import { toLonLat } from 'ol/proj'
import { LatLon } from 'geodesy/mgrs.js'
import Dms from 'geodesy/dms.js'
import { militaryFormat } from '../../shared/datetime'
import { isDefaultId, isLayerId } from '../ids'

Dms.separator = ' '

/**
 * LATLON:  59.01502 25.99332
 * DMS:     40°26′46″N 79°58′56″W
 * DM:      40°26.767′N 79°58.933′W
 * D:       40.446°N 79.982°W
 * UTM:     35 N 411919 6521940
 * MGRS:    32U MV 61344 81745
 * PLUS:    9GC7XH2P+96
 */

const formats = {
  LATLON: ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  DMS: ([lng, lat]) => `${Dms.toLat(lat, 'dms')} ${Dms.toLon(lng, 'dms')}`,
  DDM: ([lng, lat]) => `${Dms.toLat(lat, 'dm')} ${Dms.toLon(lng, 'dm')}`,
  DD: ([lng, lat]) => `${Dms.toLat(lat, 'd')} ${Dms.toLon(lng, 'd')}`,
  MGRS: ([lng, lat]) => {
    if (lat < -80 || lat > 84) return 'Outside MGRS limits'
    return new LatLon(lat, lng).toUtm().toMgrs().toString()
  },
  UTM: ([lng, lat]) => {
    if (lat < -80 || lat > 84) return 'Outside UTM limits'
    return new LatLon(lat, lng).toUtm().toString()
  }
}

const elevation = rgb => {
  if (!rgb) return null
  const value = -10000 + (((rgb[0] << 16) + (rgb[1] << 8) + rgb[2]) * 0.1)
  if (value === -10000) return null
  return value
}

export const OSDDriver = function (projectUUID, emitter, preferencesStore, projectStore, store) {
  this.projectUUID = projectUUID
  this.emitter = emitter
  this.preferencesStore = preferencesStore
  this.projectStore = projectStore
  this.store = store

  emitter.on('osd-mounted', async () => {
    this.coordinatesFormat = await preferencesStore.get('coordinates-format', 'MGRS')
    this.updateProjectName()
    this.updateDefaultLayer()
  })

  setInterval(this.updateDateTime.bind(this), 1000)

  store.on('batch', ({ operations }) => {
    const update = operations.some(({ key }) => isDefaultId(key) || isLayerId(key))
    if (update) this.updateDefaultLayer()
  })

  preferencesStore.on('coordinatesFormatChanged', ({ format }) => {
    this.coordinatesFormat = format
    if (this.lastCoordinate) this.pointermove({ coordinate: this.lastCoordinate })
  })
}

OSDDriver.prototype.pointermove = function ({ coordinate, map, pixel }) {
  this.lastCoordinate = coordinate
  if (map) this.lastMap = map
  if (pixel) this.lastPixel = pixel

  if (!this.coordinatesFormat) return
  const lonLat = toLonLat(coordinate)
  const message = formats[this.coordinatesFormat](lonLat)
  this.emitter.emit('osd', { message, cell: 'C2' })

  const getElevation = () => {
    const currentMap = map || this.lastMap
    const currentPixel = pixel || this.lastPixel
    if (!currentMap || !currentPixel) return ''

    const terrainLayers = currentMap.getLayerGroup().getLayersArray()
      .filter(l => l.get('contentType') === 'terrain/mapbox-rgb')
    if (terrainLayers.length === 0) return ''

    const data = terrainLayers
      .map(l => l.getData(currentPixel))
      .map(d => elevation(d))
      .filter(Boolean)

    if (data.length === 0) return ''
    return `${data[0].toFixed(1)}m`
  }

  this.emitter.emit('osd', { message: getElevation(), cell: 'C3' })
}

OSDDriver.prototype.updateDateTime = function () {
  const message = militaryFormat.now()
  this.emitter.emit('osd', { message, cell: 'C1' })
}

OSDDriver.prototype.updateProjectName = async function () {
  const { projectUUID, projectStore } = this
  const project = await projectStore.getProject(`project:${projectUUID}`)
  if (project) this.emitter.emit('osd', { message: project.name, cell: 'A1' })
}

OSDDriver.prototype.updateDefaultLayer = async function () {
  const layerId = await this.store.defaultLayerId()
  if (layerId) {
    const layer = await this.store.value(layerId)
    this.emitter.emit('osd', { message: layer.name, cell: 'A2' })
  } else {
    this.emitter.emit('osd', { message: '', cell: 'A2' })
  }
}
