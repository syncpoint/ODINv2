import * as K from 'kbar'

console.log(K)

export default {
  Context: K.KBarContext,
  Provider: K.KBarProvider,
  Portal: K.KBarPortal,
  Positioner: K.KBarPositioner,
  Animator: K.KBarAnimator,
  Search: K.KBarSearch,
  createAction: K.createAction,
  getListboxItemId: K.getListboxItemId,
  useKBar: K.useKBar,
  useMatches: K.useMatches,
  useRegisterActions: K.useRegisterActions,
  Results: K.KBarResults
}
