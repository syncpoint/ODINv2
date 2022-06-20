import { toLonLat } from 'ol/proj'
import { LatLon } from 'geodesy/mgrs.js'
import { militaryFormat } from '../../shared/datetime'
import { isLayerTagsId } from '../ids'

const formats = {
  LATLON: (coordinates) => `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`,
  MGRS: (coordinates) => new LatLon(coordinates[1], coordinates[0]).toUtm().toMgrs().toString(),
  UTM: (coordinates) => new LatLon(coordinates[1], coordinates[0]).toUtm().toString()
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
    const update = operations
      .filter(({ key }) => isLayerTagsId(key))
      .length !== 0

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
