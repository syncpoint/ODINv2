const curry = fn => function rec (...args) {
  return args.length >= fn.length
    ? fn(...args)
    : (...xs) => rec(...args, ...xs)
}

const identity = a => a
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x)
const when = (p, fn, arg) => p(arg) && fn(arg)
const filter = (xs, x) => xs.splice(xs.indexOf(x))
const isFunction = a => typeof a === 'function'
const prop = curry((key, object) => object[key])
const ifElse = curry((p, trueFN, falseFN, arg) =>
  p(arg)
    ? trueFN(arg)
    : falseFN(arg)
)

// Signal evaluation stack.
const stack = (() => {
  const tap = fn => v => { fn(v); return v }
  const mark = tap(signal => (signal.queued = true))
  const unmark = tap(signal => delete signal.queued)
  const frames = []
  const push = signal => !signal.queued && frames.push(mark(signal))
  const pop = () => unmark(frames.pop())
  const length = () => frames.length
  return { push, pop, length }
})()

const Signal = atom => {
  atom.map = fn => Signal.map(fn, atom)
  atom.filter = fn => Signal.filter(fn, atom)
  atom.ap = sfn => Signal.ap(sfn, atom)
  atom.chain = fn => Signal.chain(fn, atom)

  // Fantasy Land compatibility:
  atom.constructor = Signal.of
  atom['fantasy-land/map'] = atom.map
  atom['fantasy-land/filter'] = atom.filter
  atom['fantasy-land/ap'] = atom.ap
  atom['fantasy-land/chain'] = atom.chain
  return atom
}

/**
 * of :: a -> Signal a
 */
Signal.of = value => {
  const self = (...args) =>
    args.length === 0
      ? self.value
      : set(self, ...args)

  self.value = value
  self.dependent = []
  return Signal(self)
}

export default Signal

/**
 * link :: Signal s => (...[*] -> b) -> [s *] -> s b
 * link :: Signal s => (a -> b) -> s a -> s b
 * Link one or more input signals to a output signal.
 */
Signal.link = (fn, inputs) => {
  if (!fn) throw new TypeError('"fn" is undefined')
  else if (!inputs) throw new TypeError('"inputs" is undefined')
  else if (!Array.isArray(inputs) && Signal.isSignal(inputs)) return Signal.link(fn, [inputs])
  else if (!Array.isArray(inputs)) throw new TypeError('"inputs" is not an array')
  else if (inputs.length === 0) throw new TypeError('"inputs" is empty array')
  else if (inputs.some(x => !Signal.isSignal(x))) throw new TypeError('"inputs" contains non-signal or falsy value')

  const self = (...args) => {
    if (args.length === 0) return self.value
    else throw new TypeError('read-only signal')
  }

  self.fn = fn // link production/body
  self.inputs = inputs
  self.dependent = []

  // Add self to dependent list of all input streams:
  inputs.forEach(input => (input.dependent = [...input.dependent, self]))
  stack.push(self); flush()
  return Signal(self)
}

/**
 * map :: Signal s => (a -> b) -> s a -> s b
 */
Signal.map = curry((fn, signal) =>
  Signal.link(a => fn(a), signal)
)

/**
 * filter :: Signal s => (a -> Boolean) -> s a -> s a
 */
Signal.filter = curry((fn, signal) => {
  const self = Signal.of()
  Signal.link(a => fn(a) && self(a), signal)
  return self
})

/**
 * ap :: Signal s => s (a -> b) -> s a -> s b
 */
Signal.ap = curry((sfn, sa) =>
  Signal.link((fn, a) => fn(a), [sfn, sa])
)

/**
 * chain :: Signal s => (a -> s b) -> s a -> s b
 */
Signal.chain = curry((fn, sa) => {
  const isLinked = ([signal, effect]) => signal && effect
  const unlink = ([s, dependent]) => filter(s.dependent, dependent)
  const self = Signal.of()

  let signal, effect
  Signal.link(s => {
    when(isLinked, unlink, [signal, effect])
    signal = fn(s) // last :: Signal
    effect = Signal.isSignal(signal) && Signal.link(self, signal)
  }, [sa])

  return self
})

/**
 * startWith :: Signal s => a -> s a -> s a
 * startWith :: Signal s => (() -> a) -> s a -> s a
 */
Signal.startWith = curry((initial, signal) => {
  const value = isFunction(initial) ? initial() : initial
  const self = Signal.of(value)
  Signal.link(self, signal)
  return self
})

/**
 * scan :: Signal s => (b -> a -> b) -> b -> s a -> s b
 */
Signal.scan = curry((fn, acc, signal) =>
  Signal.link(x => (acc = fn(acc, x)), signal)
)

/**
 * tap :: Signal s => (a -> any) -> s a -> s a
 */
Signal.tap = curry((fn, signal) =>
  Signal.link(a => { fn(a); return a }, signal)
)

/**
 * loop :: Signal s => (b -> a -> [b, c]) -> b -> s a -> s c
 */
Signal.loop = curry((fn, acc, signal) =>
  Signal.link(a => {
    const [current, value] = fn(acc, a)
    acc = current
    return value
  }, signal)
)

/**
 * lift :: Signal s => ((a -> b -> ...) -> x) -> [s a, s b, ...] -> s x
 */
Signal.lift = (fn, ...signals) =>
  Signal.link((...values) => fn(...values), signals)

/**
 * fromListeners :: [String] -> Element -> Signal Event
 */
Signal.fromListeners = (types, target) => {
  const self = Signal.of()
  const add = type => target.addEventListener(type, self)
  const remove = type => target.removeEventListener(type, self)
  types.forEach(add)
  self.dispose = () => types.forEach(remove)
  return self
}

/**
 * Set signal value.
 */
const set = curry((signal, value) => {
  if (value === undefined) return signal // `undefined` does not propagate
  else if (value === signal.value) return signal // same value is ignored
  else {
    signal.value = value
    dependent(signal).reverse().forEach(stack.push)
    if (!stack.flushing) flush()
    return signal
  }
})

/**
 * Evaluate linked signal.
 */
const values = signal => signal.inputs.map(prop('value'))
const apply = fn => xs => fn(...xs)
const evaluate = ifElse(
  signal => Signal.isDefined(signal.inputs),
  signal => compose(set(signal), apply(signal.fn), values)(signal),
  identity
)

/**
 * Process evaluation stack top to bottom.
 */
const flush = () => {
  stack.flushing = true
  while (stack.length()) evaluate(stack.pop())
  stack.flushing = false
}

/**
 * Get all dependent in breadth-first order.
 */
const dependent = (signal, acc = []) =>
  signal.dependent.reduce((acc, x) => {
    acc.push(x)
    return dependent(x, acc)
  }, acc)

/**
 * isSignal :: any -> Boolean
 */
Signal.isSignal =
  x => x &&
  x.constructor === Signal.of

/**
 * isDefined :: Signal -> Boolean
 * isDefined :: [Signal] -> Boolean
 * Whether argument's value or values are defined.
 */
Signal.isDefined = x => Array.isArray(x)
  ? x.every(Signal.isDefined)
  : x.value !== undefined
