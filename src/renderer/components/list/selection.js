/**
 *
 */
export const toggleSelection = (selected, id) => id
  ? selected.includes(id)
    ? selected.filter(x => x !== id)
    : [...selected, id]
  : selected
