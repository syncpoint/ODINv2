/**
 *
 */
export const toggleSelection = (selected, id) => id
  ? selected.includes(id)
    ? selected.filter(x => x !== id)
    : [...selected, id]
  : selected


/**
 *
 */
export const indexOf = (entries, id) => entries.findIndex(entry => entry[0] === id)


/**
 *
 */
export const firstId = entries => entries.length
  ? entries[0][0]
  : null


/**
 *
 */
export const lastId = entries => entries.length
  ? entries[entries.length - 1][0]
  : null
