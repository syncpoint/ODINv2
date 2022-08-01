export const defaultSearch = {
  // Note: For built-in scope we use all lowercase labels.
  history: [{ key: 'root', scope: '@layer', label: 'layer' }],
  filter: ''
}

export const defaultState = {
  ...defaultSearch,
  entries: [],
  selected: [],
  focusIndex: -1,
  scroll: 'none',
  editing: false
}
