import { currentTime } from '@most/scheduler'
import { map, tap } from '@most/core'

/**
 * fromListeners :: [string] -> EventTarget -> Stream
 */
export const fromListeners = (types, target) => ({
  run: (sink, scheduler) => {
    const push = event => sink.event(currentTime(scheduler), event)
    types.forEach(type => target.addEventListener(type, push))

    return {
      dispose: () => types.forEach(type => target.removeEventListener(type, push))
    }
  }
})

export class Pipe {
  constructor (sink) { this.sink = sink }
  end (time) { this.sink.end(time) }
  error (time, err) { this.sink.end(time, err) }
}

class Op {
  constructor (sink, stream) {
    this.sink = sink
    this.stream = stream
  }

  run (sink, scheduler) {
    return this.stream.run(this.sink(sink), scheduler)
  }
}

class Replace {
  constructor (stream) {
    this.stream = stream
  }

  run (sink, scheduler) {
    return this.stream.run(new ReplaceSink(sink, scheduler), scheduler)
  }
}

class ReplaceSink extends Pipe {
  constructor (sink, scheduler) {
    super(sink)
    this.scheduler = scheduler
    this.disposable = {
      dispose: () => {}
    }
  }

  event (time, stream) {
    this.disposable.dispose()
    this.disposable = stream.run(this.sink, this.scheduler)
  }
}

/**
 * Flatten stream of arrays with depth = 1.
 */
class Flat {
  constructor (stream) {
    this.stream = stream
  }

  run (sink, scheduler) {
    this.stream.run(new FlatSink(sink), scheduler)
  }
}

class FlatSink extends Pipe {
  event (time, xs) {
    if (!Array.isArray(xs)) this.sink.event(time, xs)
    else xs.forEach(x => this.sink.event(time, x))
  }
}

export const flat = stream => new Flat(stream)
export const flatN = n => Array(n).fill(flat).reduce((f, g) => R.compose(g, f))

/**
 * replace, aka SwitchAll (RxJS)
 */
export const replace = stream => new Replace(stream)
export const orElse = value => map(that => that || value)
export const log = tap(console.log)
export const op = sink => stream => new Op(sink, stream)
export const pipe = ops => stream => ops.reduce((acc, op) => op(acc), stream)
