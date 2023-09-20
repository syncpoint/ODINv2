export default services => {
  const { clipboard } = services
  return {
    CLIPBOARD_CUT: { path: 'mdiContentCut', execute: () => clipboard.cut(), toolTip: 'Cut' },
    CLIPBOARD_COPY: { path: 'mdiContentCopy', execute: () => clipboard.copy(), toolTip: 'Copy' },
    CLIPBOARD_PASTE: { path: 'mdiContentPaste', execute: () => clipboard.paste(), toolTip: 'Paste' },
    CLIPBOARD_DELETE: { path: 'mdiTrashCanOutline', execute: () => clipboard.delete(), toolTip: 'Delete' }
  }
}
