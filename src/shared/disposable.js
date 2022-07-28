import * as R from 'ramda'

const of = object => {
  let disposed = false
  let disposables = [() => (disposed = true)]

  const dispose = disposed ? () => {} : () => R.uniq(disposables).forEach(fn => fn())

  /* eslint-disable no-sequences */
  const on = (target, event, fn) => (target.on(event, fn), () => target.off(event, fn))
  const addEventListener = (target, event, fn) => (target.addEventListener(event, fn), () => target.removeEventListener(event, fn))
  /* eslint-enable no-sequences */

  return Object.assign({}, object, {
    add: disposable => (disposables = [...disposables, disposable]),
    remove: disposable => (disposables = disposables.filter(fn => fn !== disposable)),
    on: (target, event, fn) => (disposables = [...disposables, on(target, event, fn)]),
    addEventListener: (target, event, fn) => (disposables = [...disposables, addEventListener(target, event, fn)]),
    dispose: () => (disposables = R.compose(R.always([]), dispose)()),
    disposed: () => disposed
  })
}

export const Disposable = {
  of
}
