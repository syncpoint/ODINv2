const MeasureBearingDistance = function (services) {
  this.emitter = services.emitter
  this.label = 'Measure Bearing/Distance'
  this.path = 'mdiMapMarkerDistance'
}

MeasureBearingDistance.prototype.execute = function () {
  this.emitter.emit('MEASURE_BEARING_DISTANCE')
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
  MEASURE_BEARING_DISTANCE: new MeasureBearingDistance(services),
  MEASURE_AREA: new MeasureArea(services)
})
