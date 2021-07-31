/**
 * K :: a -> a -> unit -> a
 * K-combinator aka Kestrel.
 * Useful to apply side effects.
 */
export const K = value => fn => { fn(value); return value }

/**
 * Thrush aka applyTo.
 */
export const T = value => fn => fn(value)

/**
 * I :: a -> a
 * Identity.
 */
export const I = x => x

/**
 * Hee hee hee hee... What da ya want for nothing? ... a rrrrrrrrubber biscuit?
 */
export const noop = () => {}

/**
 * uniq :: (a -> n -> [a]) -> [a]
 * Function to discard duplicate array elements.
 * Usage: Array.filter(uniq)
 */
export const uniq = (value, index, array) => array.indexOf(value) === index

/**
 * groupWith :: (a -> string) -> (a -> b) -> (string ~> b) -> a
 * Reduce array to object with values grouped by keys.
 * Usage: Array.reduce(groupWith(...), {})
 */
export const groupWith = keyFn => valueFn => (acc, a) =>
  K(acc)(acc => (acc[keyFn(a)] = (acc[keyFn(a)] || []).concat(valueFn(a))))

/**
 * nth :: number -> [a] -> a
 * Return n-th element of array.
 */
export const nth = n => xs => xs[n]
