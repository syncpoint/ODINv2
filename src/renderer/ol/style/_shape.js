import * as R from 'ramda'

/**
 *
 */
export default styles => sidc => {
  const tryer = (styles[sidc] || styles.DEFAULT)
  const catcher = (_, context) => [{ id: 'style:wasp-stroke', geometry: context.geometry }]
  return R.tryCatch(tryer, catcher)
}
