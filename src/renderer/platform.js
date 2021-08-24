export const cmdOrCtrl = ({ metaKey, ctrlKey }) => {
  return process.platform === 'darwin' ? metaKey : ctrlKey
}
