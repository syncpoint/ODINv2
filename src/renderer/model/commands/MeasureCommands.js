const MeasureBearingLength = function (services) {
  this.emitter = services.emitter
  this.label = 'Measure Bearing and Length'
  this.path = 'mdiMapMarkerDistance'
}

MeasureBearingLength.prototype.execute = function () {
  this.emitter.emit('MEASURE_LENGTH')
}

const MeasureArea = function (services) {
  this.emitter = services.emitter
  this.label = 'Measure Area'
  this.path = 'mdiVectorPolygon'
}

MeasureArea.prototype.execute = function () {
  this.emitter.emit('MEASURE_AREA')
}

export default services => ({
  MEASURE_BEARING_LENGTH: new MeasureBearingLength(services),
  MEASURE_AREA: new MeasureArea(services)
})
