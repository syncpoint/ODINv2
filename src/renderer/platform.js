const isMac = typeof window !== 'undefined' && window.odin?.platform?.isMac

export const cmdOrCtrl = ({ metaKey, ctrlKey }) => {
  return isMac ? metaKey : ctrlKey
}
