// Decouple service code from runtime service instances.
// Rationale: (service) modules should not maintain their global state.

export const DB = 'db'
export const EVENTED = 'evented'
export const MASTER = 'master'
export const SESSION = 'session'

const services = {}

export const put = (key, service) => (services[key] = service)
export const get = key => services[key]
export const del = key => delete services[key]
