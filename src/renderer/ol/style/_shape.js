import * as R from 'ramda'

/**
 *
 */
export default styles => sidc => {
  const tryer = (styles[sidc] || styles.DEFAULT)
  const catcher = (_, context) => (styles.ERROR || styles.DEFAULT)(context)
  return R.tryCatch(tryer, catcher)
}
