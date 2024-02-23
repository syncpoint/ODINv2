import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'

export default services => {
  const { clipboard } = services


  const Delete = function (services) {
    this.selection = services.selection
    this.emitter = services.emitter
    this.store = services.store
    this.path = 'mdiTrashCanOutline'
    this.isEnabled = false
    this.toolTip = 'Delete'

    this.selection.on('selection', async () => {
      if (this.selected().length === 0) {
        this.isEnabled = false
      } else {
        const [shared] = await this.store.collect(this.selection.selected()[0], [ID.sharedId])
        this.isEnabled = !shared ?? true
      }
      this.emit('changed')
    })
  }
  Object.assign(Delete.prototype, EventEmitter.prototype)

  Delete.prototype.execute = function () {
    clipboard.delete()
  }

  Delete.prototype.enabled = function () {
    return this.isEnabled
  }

  Delete.prototype.selected = function () {
    return this.selection.selected().filter(ID.isLayerId)
  }


  return {
    CLIPBOARD_CUT: { path: 'mdiContentCut', execute: () => clipboard.cut(), toolTip: 'Cut' },
    CLIPBOARD_COPY: { path: 'mdiContentCopy', execute: () => clipboard.copy(), toolTip: 'Copy' },
    CLIPBOARD_PASTE: { path: 'mdiContentPaste', execute: () => clipboard.paste(), toolTip: 'Paste' },
    CLIPBOARD_DELETE: new Delete(services)
  }
}
