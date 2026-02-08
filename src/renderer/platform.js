export const cmdOrCtrl = ({ metaKey, ctrlKey }) => {
  return window.odin.platform.isMac ? metaKey : ctrlKey
}
