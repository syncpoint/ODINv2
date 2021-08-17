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
   * focusId :: id | null
   *
   * Used to remember focused entry between updates of entry list,
   * where focusIndex may be invalid after update.
   * if set, focusId has precedence over focusIndex.
   */
  focusId: null,

  /**
   * focusIndex :: int
   *
   * Index in entries or -1 for undefined.
   */
  focusIndex: -1,

  /**
   * selected :: [id]
   *
   * Zero, one or more ids of selected entries.
   */
  selected: [],

  /**
   * scroll: 'none' | 'smooth' | 'auto'
   *
   * Scroll behavior for element.scrollIntoView().
   */
  scroll: 'auto'
}
