export const ERR_INVALID_ARG = 'ERR_INVALID_ARG'

export const error = (code, message) => {
  const error = new Error(`[${code}]: ${message}`)
  error.code = code
  return error
}
