import util from 'util'
import Emitter from '../shared/emitter'

/**
 * @constructor
 * @fires ...
 */
export function DragAndDrop () {
  Emitter.call(this)
}

DragAndDrop.prototype.dragover = function (event) {
  event.preventDefault()
  event.stopPropagation()

  console.log('[DragAndDrop] drop', event)
}

DragAndDrop.prototype.drop = function (event) {
  event.preventDefault()
  event.stopPropagation()

  const files = [...event.dataTransfer.files]
  console.log('[DragAndDrop] drop', files)
}

util.inherits(DragAndDrop, Emitter)

