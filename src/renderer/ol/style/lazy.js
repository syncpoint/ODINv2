
/**
 *
 */
export const lazy = function (fn) {
  let evaluated = false
  let value

  return function () {
    if (evaluated) return value
    value = fn.apply(this, arguments)
    evaluated = true
    return value
  }
}
