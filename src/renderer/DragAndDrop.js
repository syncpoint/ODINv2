import util from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import uuid from 'uuid-random'
import Emitter from '../shared/emitter'

const readJSON = async path => {
  const content = await fs.readFile(path, 'utf8')
  return JSON.parse(content)
}

/**
 * @constructor
 * @fires ...
 */
export function DragAndDrop () {
  Emitter.call(this)
}

util.inherits(DragAndDrop, Emitter)

DragAndDrop.prototype.dragenter = function (event) {}
DragAndDrop.prototype.dragleave = function (event) {}

DragAndDrop.prototype.dragover = function (event) {
  event.preventDefault()
  event.stopPropagation()
}

DragAndDrop.prototype.drop = async function (event) {
  event.preventDefault()
  event.stopPropagation()

  const files = [...event.dataTransfer.files]
  const layers = await Promise.all(files
    .filter(file => path.extname(file.name) === '.json')
    .map(async file => {

      // Assign unique ids to layer/features:
      const layerUUID = uuid()
      const geoJSON = await readJSON(file.path)
      geoJSON.id = `layer:${layerUUID}`
      geoJSON.name = path.basename(file.name, '.json')
      geoJSON.features = geoJSON.features.map(feature => {
        delete feature.title // legacy
        feature.id = `feature:${layerUUID}/${uuid()}`
        return feature
      })

      return geoJSON
    }))

  if (layers.length) this.emit('layers', { layers })
}


