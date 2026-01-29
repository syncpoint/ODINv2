export const defaultSearch = {
  // Note: For built-in scope we use all lowercase labels.
  history: [{ key: 'root', scope: '@layer', label: 'layer' }],
  filter: '',
  // Stores filter text per scope so switching scopes remembers the search
  filters: {}
}

export const defaultState = {
  entries: [],
  selected: [],
  focusIndex: -1,
  scroll: 'none',
  editing: false
}
