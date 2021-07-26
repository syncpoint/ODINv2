import util from 'util'
import { promises as fs } from 'fs'
import path from 'path'
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
  files
    .filter(file => path.extname(file.name) === '.json')
    .forEach(async file => this.emit('json', { file, json: await readJSON(file.path) }))
}


