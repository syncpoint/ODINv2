export const singleselect = callbacks => ({
  snapshot: (state, { ids }) => {
    return { ...state, ids }
  },

  click: (state, { index, shiftKey, metaKey }) => {
    return state
  },

  'keydown/ArrowDown': (state, { shiftKey, metaKey }) => {
    return state
  },

  'keydown/ArrowUp': (state, { shiftKey, metaKey }) => {
    return state
  }
})
