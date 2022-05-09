export { singleselect } from './singleselect'
export { multiselect } from './multiselect'

/**
 *
 */
export const initialState = {

  /**
   * entries :: [{ id, ...any }]
   *
   * Entry must have public `id` property.
   */
  entries: [],

  /**
   * selected :: [id]
   *
   * Zero, one or more ids of selected entries.
   * Last selected entry has implicit focus in multiselect lists.
   */
  selected: [],

  /**
   * scroll: 'none' | 'smooth' | 'auto'
   *
   * Scroll behavior for element.scrollIntoView().
   */
  scroll: 'auto'
}
