/**
 * Commands for drawing shapes (lines and polygons without military semantics).
 */

const DrawShapeLine = function (services) {
  this.emitter = services.emitter
  this.label = 'Draw Line'
  this.path = 'mdiVectorLine'
}

DrawShapeLine.prototype.execute = function () {
  this.emitter.emit('DRAW_SHAPE_LINE')
}


const DrawShapePolygon = function (services) {
  this.emitter = services.emitter
  this.label = 'Draw Polygon'
  this.path = 'mdiVectorPolygon'
}

DrawShapePolygon.prototype.execute = function () {
  this.emitter.emit('DRAW_SHAPE_POLYGON')
}


export default services => ({
  DRAW_SHAPE_LINE: new DrawShapeLine(services),
  DRAW_SHAPE_POLYGON: new DrawShapePolygon(services)
})
