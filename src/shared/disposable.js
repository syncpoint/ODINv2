import * as R from 'ramda'

const of = object => {
  let disposed = false
  let disposables = [() => (disposed = true)]

  const dispose = disposed ? () => {} : () => R.uniq(disposables).forEach(fn => fn())

  return Object.assign({}, object, {
    addDisposable: disposable => (disposables = [...disposables, disposable]),
    removeDisposable: disposable => (disposables = disposables.filter(fn => fn !== disposable)),
    dispose: () => (disposables = R.compose(R.always([]), dispose)()),
    disposed: () => disposed
  })
}

export const Disposable = {
  of
}
