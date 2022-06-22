import { toLonLat } from 'ol/proj'
import { LatLon } from 'geodesy/mgrs.js'
import Dms from 'geodesy/dms.js'
import { militaryFormat } from '../../shared/datetime'
import { isDefaultId } from '../ids'
import OpenLocationCode from './openlocationcode'


/**
 * DMS:  40°26′46″N 79°58′56″W
 * DM:   40°26.767′N 79°58.933′W
 * D:    40.446°N 79.982°W
 * UTM:  32U 461344 5481745
 * MGRS: 32U MV 61344 81745
 */

const formats = {
  LATLON: ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  DMS: ([lng, lat]) => `${Dms.toLat(lat, 'dms')} ${Dms.toLon(lng, 'dms')}`,
  DDM: ([lng, lat]) => `${Dms.toLat(lat, 'dm')} ${Dms.toLon(lng, 'dm')}`,
  DD: ([lng, lat]) => `${Dms.toLat(lat, 'd')} ${Dms.toLon(lng, 'd')}`,
  MGRS: ([lng, lat]) => new LatLon(lat, lng).toUtm().toMgrs().toString(),
  UTM: ([lng, lat]) => new LatLon(lat, lng).toUtm().toString(),
  PLUS: ([lng, lat]) => OpenLocationCode.encode(lat, lng)
}

export const OSDDriver = function (projectUUID, emitter, preferencesStore, projectStore, featureStore) {
  this.projectUUID = projectUUID
  this.emitter = emitter
  this.preferencesStore = preferencesStore
  this.projectStore = projectStore
  this.featureStore = featureStore

  ;(async () => {
    this.coordinatesFormat = await preferencesStore.get('coordinates-format', 'MGRS')
    this.updateProjectName()
    this.updateDefaultLayer()
  })()

  setInterval(this.updateDateTime.bind(this), 1000)

  featureStore.on('batch', ({ operations }) => {
    const update = operations.some(({ key }) => isDefaultId(key))
    if (update) this.updateDefaultLayer()
  })

  preferencesStore.on('coordinatesFormatChanged', ({ format }) => {
    this.coordinatesFormat = format
    if (this.lastCoordinate) this.pointermove({ coordinate: this.lastCoordinate })
  })
}

OSDDriver.prototype.pointermove = function ({ coordinate }) {
  this.lastCoordinate = coordinate

  if (!this.coordinatesFormat) return
  const lonLat = toLonLat(coordinate)
  const message = formats[this.coordinatesFormat](lonLat)
  this.emitter.emit('osd', { message, cell: 'C2' })
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
  const { featureStore } = this

  const layerId = await featureStore.defaultLayerId()
  if (layerId) {
    const layer = await featureStore.value(layerId)
    this.emitter.emit('osd', { message: layer.name, cell: 'A2' })
  } else {
    this.emitter.emit('osd', { message: '', cell: 'A2' })
  }
}
