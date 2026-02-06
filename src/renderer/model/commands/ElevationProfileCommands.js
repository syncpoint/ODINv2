const ElevationProfile = function (services) {
  this.emitter = services.emitter
  this.label = 'Elevation Profile'
  this.path = 'mdiChartAreaspline'
}

ElevationProfile.prototype.execute = function () {
  this.emitter.emit('ELEVATION_PROFILE')
}

export default services => ({
  ELEVATION_PROFILE: new ElevationProfile(services)
})
