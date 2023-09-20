/**
 *
 * @param {String} name The environment variable name to check
 * @param {Boolean} defaultValue Can either be true or false. If omitted the default value is always true
 * @returns {Boolean} Either the value of the environment variable or the default value
 */
export const isEnabled = (name, defaultValue = true) => {
  if (!process.env[name]) return defaultValue
  if (process.env[name].toUpperCase() === 'TRUE') return true
  if (process.env[name] === '1') return true
  return false
}
