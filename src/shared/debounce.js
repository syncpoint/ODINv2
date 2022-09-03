import * as R from 'ramda'
import { debounce as debounce_ } from 'throttle-debounce'

// Debounce with better composability.
const curriedDebounce = R.curry((options, delay, callback) => debounce_(delay, callback, options))
export const debounce = curriedDebounce({ atBegin: false })
export const immediateDebounce = curriedDebounce({ atBegin: true })

// Batch handler array argrument for delayed function (debounce or throttle).
export const batch = R.curry((delayed, fn) => {
  const acc = []
  const handler = delayed(() => fn(acc.splice(0)))
  return xs => { acc.push(...xs); handler() }
})
