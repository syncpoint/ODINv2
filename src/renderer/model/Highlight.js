import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { LAYER_ID, FEATURE_ID } from '../../shared/emitter-ids'
import * as TS from '../ol/ts'
import { transform, geometryType, readGeometry } from './geometry'
import { scope } from '../ids'

export function Highlight (store, selection, emitter, viewMemento) {
  Emitter.call(this)
  this.store_ = store
  this.selection_ = selection
  this.emitter_ = emitter
  this.viewMemento_ = viewMemento

  const timerFired = () => {
    delete this.timeout_
    this.off_()
  }

  const startTimer = () => {
    if (this.timeout_) clearTimeout(this.timeout_)
    this.timeout_ = setTimeout(timerFired, 5000)
  }

  const cancelTimer = () => {
    if (this.timeout_) clearTimeout(this.timeout_)
    delete this.timeout_
  }

  const down = event => {
    startTimer()
    this.on_(event)
  }

  const up = () => {
    cancelTimer()
    this.off_()
  }

  emitter.on(`:id(${LAYER_ID})/identify/down`, down)
  emitter.on(`:id(${FEATURE_ID})/identify/down`, down)
  emitter.on(`:id(${LAYER_ID})/identify/up`, up)
  emitter.on(`:id(${FEATURE_ID})/identify/up`, up)
}

util.inherits(Highlight, Emitter)


/**
 * layerBounds_ :: [jsts/Geometry] -> [string] -> [jsts/Geometry]
 */
Highlight.prototype.layerBounds_ = function (acc, ids) {

  const read = R.compose(TS.read, readGeometry)
  const write = TS.write

  return ids.reduce(async (acc, id) => {
    const bounds = await acc
    const geometries = await this.store_.selectGeometries(id)
    if (!geometries.length) return bounds

    const collection = TS.collect(geometries.map(read))
    bounds.push(write(TS.minimumRectangle(collection)))
    return bounds
  }, acc)
}


/**
 * featureBounds_ :: [jsts/Geometry] -> [string] -> [jsts/Geometry]
 */
Highlight.prototype.featureBounds_ = async function (acc, ids) {
  const resolution = this.viewMemento_.resolution()

  const featureBounds = {
    Polygon: R.identity,
    LineString: geometry => TS.lineBuffer(geometry)(resolution * 10),
    'LineString:Point': geometry => {
      const [lineString, point] = TS.geometries(geometry)
      const segment = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate))
      const width = segment.getLength()
      return TS.lineBuffer(lineString)(width)
    },
    MultiPoint: geometry => {
      const [center, ...coords] = TS.coordinates(geometry)
      const ranges = coords.map(coord => TS.segment(center, coord).getLength())
      const range = Math.max(...ranges)
      return TS.pointBuffer(TS.point(center))(range)
    }
  }

  const geometries = await this.store_.selectGeometries(ids)
  return geometries
    .map(readGeometry)
    .reduce((acc, geometry) => {
      const type = geometryType(geometry)
      const { read, write } = transform(geometry)
      const bounds = featureBounds[type] || (geometry => TS.minimumRectangle(geometry))
      acc.push(write(bounds(read(geometry))))
      return acc
    }, acc)
}


/**
 *
 */
Highlight.prototype.on_ = async function ({ id }) {
  const ids = R.uniq([id, ...this.selection_.selected()])

  const scopes = R.groupBy(id => scope(id), ids)
  const geometries = await Object.entries(scopes).reduce(async (acc, scope) => {
    const bounds = await acc
    if (!this[`${scope[0]}Bounds_`]) return bounds
    else return this[`${scope[0]}Bounds_`](bounds, scope[1])
  }, [])

  this.emit('highlight/geometries', { geometries })
}


/**
 *
 */
Highlight.prototype.off_ = function () {
  this.emit('highlight/geometries', { geometries: [] })
}
