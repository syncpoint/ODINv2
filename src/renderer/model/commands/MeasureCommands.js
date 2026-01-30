/**
 * @typedef {Object} Services
 * @property {Object} emitter - Event emitter for inter-component communication
 */

/**
 * @typedef {Object} MeasureCommand
 * @property {Object} emitter - Event emitter reference
 * @property {string} label - Display label for the command
 * @property {string} path - MDI icon path identifier
 * @property {function(): void} execute - Executes the command
 */

/**
 * @typedef {Object} MeasureCommands
 * @property {MeasureCommand} MEASURE_DISTANCE - Command to measure distance
 * @property {MeasureCommand} MEASURE_AREA - Command to measure area
 */

/**
 * Command constructor for measuring distances on the map.
 * @constructor
 * @param {Services} services - Application services
 */
const MeasureDistance = function (services) {
  /** @type {Object} */
  this.emitter = services.emitter
  /** @type {string} */
  this.label = 'Measure Distance'
  /** @type {string} */
  this.path = 'mdiMapMarkerDistance'
}

/**
 * Executes the measure distance command by emitting the MEASURE_DISTANCE event.
 * @returns {void}
 */
MeasureDistance.prototype.execute = function () {
  this.emitter.emit('MEASURE_DISTANCE')
}

/**
 * Command constructor for measuring areas on the map.
 * @constructor
 * @param {Services} services - Application services
 */
const MeasureArea = function (services) {
  /** @type {Object} */
  this.emitter = services.emitter
  /** @type {string} */
  this.label = 'Measure Area'
  /** @type {string} */
  this.path = 'mdiVectorPolygon'
}

/**
 * Executes the measure area command by emitting the MEASURE_AREA event.
 * @returns {void}
 */
MeasureArea.prototype.execute = function () {
  this.emitter.emit('MEASURE_AREA')
}

/**
 * Command constructor for measuring circles on the map.
 * @constructor
 * @param {Services} services - Application services
 */
const MeasureCircle = function (services) {
  /** @type {Object} */
  this.emitter = services.emitter
  /** @type {string} */
  this.label = 'Measure Circle'
  /** @type {string} */
  this.path = 'mdiCircleOutline'
}

/**
 * Executes the measure circle command by emitting the MEASURE_CIRCLE event.
 * @returns {void}
 */
MeasureCircle.prototype.execute = function () {
  this.emitter.emit('MEASURE_CIRCLE')
}

/**
 * Creates and returns the measure commands.
 * @param {Services} services - Application services
 * @returns {MeasureCommands} Object containing MEASURE_DISTANCE, MEASURE_AREA, and MEASURE_CIRCLE commands
 */
export default services => ({
  MEASURE_DISTANCE: new MeasureDistance(services),
  MEASURE_AREA: new MeasureArea(services),
  MEASURE_CIRCLE: new MeasureCircle(services)
})
