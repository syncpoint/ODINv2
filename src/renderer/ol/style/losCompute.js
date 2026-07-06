/**
 * Bridge between the Line-of-Sight interaction (which owns the map and
 * the elevation service) and the los style orchestrator (which only has
 * per-feature signals).
 *
 * The interaction registers a computer once a terrain layer is
 * available; each los feature's style registers an invalidator so
 * pending features restyle as soon as terrain arrives.
 */

let computer = null // params -> Promise<result|null>
const invalidators = new Map() // featureId -> () => void

/**
 * @param {(params: {observer, target, observerHeight, targetHeight}) => Promise} fn
 */
export const setComputer = fn => {
  computer = fn
  invalidators.forEach(invalidate => invalidate())
}

export const compute = params =>
  computer ? computer(params) : Promise.resolve(null)

export const registerInvalidator = (featureId, fn) =>
  invalidators.set(featureId, fn)
