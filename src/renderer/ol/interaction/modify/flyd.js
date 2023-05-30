import flyd from 'flyd'

/**
 * fromListeners :: [String] -> Element -> Stream Event
 */
flyd.fromListeners = (types, target) => {
  const stream = flyd.stream()
  const add = type => target.addEventListener(type, stream)
  const remove = type => target.removeEventListener(type, stream)
  types.forEach(add)
  flyd.on(() => types.forEach(remove), stream.end)
  return stream
}

/**
 * filter :: (a -> Boolean) -> Stream a -> Stream a
 *
 * stream:               -1-2-3-4->
 * filter(even, stream): ---2---4->
 */
flyd.filter = flyd.curryN(2, (p, stream) =>
  flyd.combine((s, self) => {
    const value = s()
    if (p(value)) self(value)
  }, [stream])
)

/**
 * reject :: (a -> Boolean) -> Stream a -> Stream a
 *
 * stream:               -1-2-3-4->
 * reject(even, stream): -1---3--->
 */
flyd.reject = flyd.curryN(2, (fn, stream) =>
  flyd.combine((s, self) => {
    const value = s()
    if (!fn(value)) self(value)
  }, [stream])
)

/**
 * lift :: Stream S => (S -> ... S -> x) -> S x
 *
 * a:               ---1----2--->
 * b:               -----1----2->
 * lift(add, a, b): -----2--3-4->
 */
flyd.lift = (fn, ...streams) =>
  flyd.combine(() => fn(...streams.map(fn => fn())), streams)

/**
 * loop :: Stream S => (acc -> b -> [acc, b]) -> acc -> S a -> S b
 *
 * Accumulate results using a feedback loop that emits one value and
 * feeds back another to be used in the next iteration.
 *
 * fn = (acc, n) => [acc + n, acc + 1]
 * n             : -0-1-2-3-4->
 * loop(fn, 0, n): -1-1-2-4-7->
 */
flyd.loop = flyd.curryN(3, (fn, initial, stream) =>
  flyd.combine((s, self) => {
    const [current, value] = fn(initial, s())
    initial = current
    self(value)
  }, [stream])
)

export default flyd
