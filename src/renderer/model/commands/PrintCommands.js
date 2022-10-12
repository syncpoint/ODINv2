const PrintCommand = function (services) {
  this.emitter = services.emitter
  this.path = 'mdiPrinterOutline'
}

PrintCommand.prototype.execute = async function () {
  this.emitter.emit('PRINT_MAP')
}

export default services => ({
  PRINT_MAP: new PrintCommand(services)
})
