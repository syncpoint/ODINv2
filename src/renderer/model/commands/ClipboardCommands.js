export default services => {
  const { clipboard } = services
  return {
    CLIPBOARD_CUT: { path: 'mdiContentCut', execute: () => clipboard.cut() },
    CLIPBOARD_COPY: { path: 'mdiContentCopy', execute: () => clipboard.copy() },
    CLIPBOARD_PASTE: { path: 'mdiContentPaste', execute: () => clipboard.paste() },
    CLIPBOARD_DELETE: { path: 'mdiTrashCanOutline', execute: () => clipboard.delete() }
  }
}
