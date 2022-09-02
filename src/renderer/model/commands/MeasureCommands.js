const MeasureBearingLength = function (services) {
  this.emitter = services.emitter
  this.label = 'Measure Bearing and Length'
  this.path = 'mdiRuler'
}

MeasureBearingLength.prototype.execute = function () {
  this.emitter.emit('MAP_MEASURE_LENGTH')
}

export default services => ({
  MEASURE_BEARING_LENGTH: new MeasureBearingLength(services)
})
