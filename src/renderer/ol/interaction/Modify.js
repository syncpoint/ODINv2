import PointerInteraction from 'ol/interaction/Pointer'
import MapBrowserEventType from 'ol/MapBrowserEventType'
import Collection from 'ol/Collection'
import CollectionEventType from 'ol/CollectionEventType'
import VectorEventType from 'ol/source/VectorEventType'
import Event from 'ol/events/Event'
import EventType from 'ol/events/EventType'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { createEditingStyle } from 'ol/style/Style'
import GeometryType from 'ol/geom/GeometryType'
import RBush from 'ol/structs/RBush'
import { equals as arrayEquals } from 'ol/array'
import { getUid } from 'ol/util'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import * as Condition from 'ol/events/condition'
import * as Extent from 'ol/extent'
import * as Coordinate from 'ol/coordinate'
import * as Proj from 'ol/proj'
import { special } from './special-sauce'

const tempExtent = [0, 0, 0, 0]
const tempSegment = []

const ModifyEventType = {
  MODIFYSTART: 'modifystart',
  MODIFYEND: 'modifyend'
}

export class ModifyEvent extends Event {
  constructor (type, features, MapBrowserEvent) {
    super(type)
    this.features = features
    this.mapBrowserEvent = MapBrowserEvent
  }
}

const defaultDeleteCondition = function (mapBrowserEvent) {
  return Condition.altKeyOnly(mapBrowserEvent) && Condition.singleClick(mapBrowserEvent)
}

function getDefaultStyleFunction () {
  const style = createEditingStyle()
  return function () {
    return style[GeometryType.POINT]
  }
}

function projectedDistanceToSegmentDataSquared (
  pointCoordinates,
  segmentData,
  projection
) {
  const coordinate = Proj.fromUserCoordinate(pointCoordinates, projection)
  tempSegment[0] = Proj.fromUserCoordinate(segmentData.segment[0], projection)
  tempSegment[1] = Proj.fromUserCoordinate(segmentData.segment[1], projection)
  return Coordinate.squaredDistanceToSegment(coordinate, tempSegment)
}

function closestOnSegmentData (pointCoordinates, segmentData, projection) {
  const coordinate = Proj.fromUserCoordinate(pointCoordinates, projection)
  tempSegment[0] = Proj.fromUserCoordinate(segmentData.segment[0], projection)
  tempSegment[1] = Proj.fromUserCoordinate(segmentData.segment[1], projection)
  return Proj.toUserCoordinate(
    Coordinate.closestOnSegment(coordinate, tempSegment),
    projection
  )
}


function compareIndexes (a, b) {
  return a.index - b.index
}


/**
 * Custom Modify interaction. This is different from stock Modify:
 * - Circle geometry is not supported
 * - options.features is not supported (use options.source)
 * - options.hitDetection is not supported
 * - only one feature can be modified at a time
 */
class Modify extends PointerInteraction {

  constructor (options) {
    super(options)

    /* eslint-disable no-unused-expressions */
    this.on
    this.once
    this.un
    /* eslint-enable no-unused-expressions */

    this.boundHandleFeatureChange_ = this.handleFeatureChange_.bind(this)
    this.condition_ = options.condition ? options.condition : Condition.primaryAction
    this.deleteCondition_ = options.deleteCondition ? options.deleteCondition : defaultDeleteCondition
    this.insertVertexCondition_ = options.insertVertexCondition ? options.insertVertexCondition : Condition.always
    this.vertexFeature_ = null
    this.vertexSegments_ = null
    this.lastPixel_ = [0, 0]
    this.ignoreNextSingleClick_ = false
    this.featuresBeingModified_ = null
    this.index_ = new RBush() // TODO: use geometry-instance specific rbush
    this.pixelTolerance_ = options.pixelTolerance !== undefined ? options.pixelTolerance : 10
    this.snappedToVertex_ = false
    this.changingFeature_ = false
    this.dragSegments_ = []
    this.lastPointerEvent_ = null
    this.delta_ = [0, 0]

    this.overlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!options.wrapX
      }),
      style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })

    this.snapToPointer_ = options.snapToPointer === undefined
      ? false
      : options.snapToPointer


    const source = options.source
    this.features_ = source.getFeatures().length === 1
      ? new Collection(source.getFeatures())
      : new Collection()

    this.features_.forEach(this.addFeature_.bind(this))
    this.features_.addEventListener(CollectionEventType.ADD, this.handleFeatureAdd_.bind(this))
    this.features_.addEventListener(CollectionEventType.REMOVE, this.handleFeatureRemove_.bind(this))

    // FIXME: possible source event listener leaks (move to setMap())
    source.addEventListener(VectorEventType.REMOVEFEATURE, this.handleSourceRemove_.bind(this))
    source.addEventListener(VectorEventType.ADDFEATURE, event => {
      if (source.getFeatures().length === 1) this.handleSourceAdd_(event)
      else this.features_.clear()
    })
  }

  handleSourceAdd_ ({ feature }) { this.features_.push(feature) }
  handleSourceRemove_ ({ feature }) { this.features_.remove(feature) }
  handleFeatureAdd_ ({ element }) { this.addFeature_(element) }
  handleFeatureRemove_ ({ element }) { this.removeFeature_(element) }

  handleFeatureChange_ ({ target }) {
    // Note: This is triggered also when a feature is moved between sources,
    // because its style is updated in the process.
    if (!this.changingFeature_) {
      this.removeFeature_(target)
      this.addFeature_(target)
    }
  }


  addFeature_ (feature) {
    // TODO: get feature geometries (callback)
    // TODO: index geometries (RBush per geometry)

    this.special_ = special(feature)
    this.special_.roles().forEach(role => {
      const geometry = this.special_.geometry(role)
      const writer = indexWriters[geometry.getType()]
      if (writer) writer(this.index_, feature, geometry, role)
    })

    const map = this.getMap()
    if (map && map.isRendered() && this.getActive()) {
      this.handlePointerAtPixel_(this.lastPixel_, map)
    }

    feature.addEventListener(EventType.CHANGE, this.boundHandleFeatureChange_)
  }


  removeFeature_ (feature) {
    this.removeFeatureSegmentData_(feature)

    // Remove the vertex feature if the collection of canditate features is empty.
    if (this.vertexFeature_ && this.features_.getLength() === 0) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_)
      this.vertexFeature_ = null
    }

    feature.removeEventListener(
      EventType.CHANGE,
      this.boundHandleFeatureChange_
    )
  }


  removeFeatureSegmentData_ (feature) {
    const nodes = []

    this.index_.forEach(function (node) {
      if (feature === node.feature) {
        nodes.push(node)
      }
    })

    for (let i = nodes.length - 1; i >= 0; --i) {
      for (let j = this.dragSegments_.length - 1; j >= 0; --j) {
        if (this.dragSegments_[j][0] === nodes[i]) {
          this.dragSegments_.splice(j, 1)
        }
      }

      this.index_.remove(nodes[i])
    }
  }


  setActive (active) {
    if (this.vertexFeature_ && !active) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_)
      this.vertexFeature_ = null
    }

    super.setActive(active)
  }


  setMap (map) {
    this.overlay_.setMap(map)
    super.setMap(map)
  }


  /**
   * Function handling "down" events.
   * If the function returns true then a drag sequence is started.
   */
  handleDownEvent (event) {
    if (!this.condition_(event)) return false

    const pixelCoordinate = event.coordinate
    this.handlePointerAtPixel_(event.pixel, event.map, pixelCoordinate)
    this.dragSegments_.length = 0
    this.featuresBeingModified_ = null
    const vertexFeature = this.vertexFeature_

    if (vertexFeature) {
      const insertVertices = []
      const vertex = vertexFeature.getGeometry().getCoordinates()
      const vertexExtent = Extent.boundingExtent([vertex])
      const segmentDataMatches = this.index_.getInExtent(vertexExtent)
      const componentSegments = {}
      segmentDataMatches.sort(compareIndexes)

      for (let i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
        const segmentDataMatch = segmentDataMatches[i]
        const segment = segmentDataMatch.segment
        let uid = getUid(segmentDataMatch.geometry)
        const depth = segmentDataMatch.depth

        if (depth) {
          // separate feature components
          uid += '-' + depth.join('-')
        }

        if (!componentSegments[uid]) {
          componentSegments[uid] = new Array(2)
        }

        if (
          Coordinate.equals(segment[0], vertex) &&
          !componentSegments[uid][0]
        ) {
          this.dragSegments_.push([segmentDataMatch, 0])
          componentSegments[uid][0] = segmentDataMatch
          continue
        }

        if (
          Coordinate.equals(segment[1], vertex) &&
          !componentSegments[uid][1]
        ) {
          // prevent dragging closed linestrings by the connecting node
          if (
            (segmentDataMatch.geometry.getType() === GeometryType.LINE_STRING ||
              segmentDataMatch.geometry.getType() ===
                GeometryType.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0
          ) {
            continue
          }

          this.dragSegments_.push([segmentDataMatch, 1])
          componentSegments[uid][1] = segmentDataMatch
          continue
        }

        if (
          getUid(segment) in this.vertexSegments_ &&
          !componentSegments[uid][0] &&
          !componentSegments[uid][1] &&
          this.insertVertexCondition_(event)
        ) {
          insertVertices.push(segmentDataMatch)
        }
      }

      if (insertVertices.length) {
        console.log('insertVertices', insertVertices.length)
        this.willModifyFeatures_(event, [insertVertices])
      }

      for (let j = insertVertices.length - 1; j >= 0; --j) {
        this.insertVertex_(insertVertices[j], vertex)
      }
    }

    return !!this.vertexFeature_
  }


  /**
   * Function handling "up" events.
   * If the function returns false then the current drag sequence is stopped.
   */
  handleUpEvent (event) {
    for (let i = this.dragSegments_.length - 1; i >= 0; --i) {
      const segmentData = this.dragSegments_[i][0]
      this.index_.update(Extent.boundingExtent(segmentData.segment), segmentData)
    }

    if (this.featuresBeingModified_) {
      this.dispatchEvent(new ModifyEvent(
        ModifyEventType.MODIFYEND,
        this.featuresBeingModified_,
        event
      ))
      this.featuresBeingModified_ = null
    }

    return false
  }


  /**
   * Function handling "drag" events.
   * This function is called on "move" events during a drag sequence.
   */
  handleDragEvent (event) {
    this.ignoreNextSingleClick_ = false
    this.willModifyFeatures_(event, this.dragSegments_)

    const vertex = this.special_.capture([
      event.coordinate[0] + this.delta_[0],
      event.coordinate[1] + this.delta_[1]
    ], this.dragSegments_)

    for (let i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
      const dragSegment = this.dragSegments_[i]
      const segmentData = dragSegment[0]
      const role = segmentData.role
      const feature = segmentData.feature
      const geometry = segmentData.geometry
      const segment = segmentData.segment
      const index = dragSegment[1]

      while (vertex.length < geometry.getStride()) {
        vertex.push(segment[index][vertex.length])
      }

      if (segmentUpdaters[geometry.getType()]) {
        const coordinates = segmentUpdaters[geometry.getType()](vertex, dragSegment)
        this.setGeometryCoordinates_(role, feature, coordinates)
      }
    }

    this.createOrUpdateVertexFeature_(vertex)
  }


  /**
   * Method called by the map to notify the interaction that a
   * browser event was dispatched to the map.
   * The function may return false to prevent the propagation
   * of the event to other interactions in the map's interactions
   * chain.
   */
  handleEvent (event) {
    if (!event.originalEvent) return true
    this.lastPointerEvent_ = event

    const isInteracting = event.map.getView().getInteracting()
    const isPointerMove = event.type === MapBrowserEventType.POINTERMOVE
    const isSingleClick = event.type === MapBrowserEventType.SINGLECLICK
    const isDeleteCondition = this.deleteCondition_(event)
    const ignoreNextSingleClick = this.ignoreNextSingleClick_
    const isHandlingUpDownSequence = this.handlingDownUpSequence // super
    const handlePointerMove = !isInteracting && isPointerMove && !isHandlingUpDownSequence

    if (handlePointerMove) this.handlePointerMove_(event)

    let handled
    if (this.vertexFeature_ && isDeleteCondition) {
      if (!isSingleClick || !ignoreNextSingleClick) handled = this.removePoint()
      else handled = true
    }

    if (isSingleClick) this.ignoreNextSingleClick_ = false

    return super.handleEvent(event) && !handled
  }


  willModifyFeatures_ (event, segments) {
    if (!this.featuresBeingModified_) {
      this.featuresBeingModified_ = new Collection()
      const features = this.featuresBeingModified_.getArray()

      for (let i = 0, ii = segments.length; i < ii; ++i) {
        const segment = segments[i]
        for (let s = 0, ss = segment.length; s < ss; ++s) {
          const feature = segment[s].feature
          if (feature && features.indexOf(feature) === -1) {
            this.featuresBeingModified_.push(feature)
          }
        }
      }

      if (this.featuresBeingModified_.getLength() === 0) {
        this.featuresBeingModified_ = null
      } else {
        this.dispatchEvent(new ModifyEvent(
          ModifyEventType.MODIFYSTART,
          this.featuresBeingModified_,
          event
        ))
      }
    }
  }


  insertVertex_ (segmentData, vertex) {
    const role = segmentData.role
    const segment = segmentData.segment
    const feature = segmentData.feature
    const geometry = segmentData.geometry
    const depth = segmentData.depth
    const index = segmentData.index
    let coordinates

    while (vertex.length < geometry.getStride()) {
      vertex.push(0)
    }

    switch (geometry.getType()) {
      case GeometryType.MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates()
        coordinates[depth[0]].splice(index + 1, 0, vertex)
        break
      case GeometryType.POLYGON:
        coordinates = geometry.getCoordinates()
        coordinates[depth[0]].splice(index + 1, 0, vertex)
        break
      case GeometryType.MULTI_POLYGON:
        coordinates = geometry.getCoordinates()
        coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex)
        break
      case GeometryType.LINE_STRING:
        coordinates = geometry.getCoordinates()
        coordinates.splice(index + 1, 0, vertex)
        break
      default:
        return
    }

    this.setGeometryCoordinates_(role, feature, coordinates)
    this.index_.remove(segmentData)
    this.updateSegmentIndices_(geometry, index, depth, 1)

    const segmentDataA = {
      role,
      segment: [segment[0], vertex],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index
    }

    this.index_.insert(Extent.boundingExtent(segmentDataA.segment), segmentDataA)
    this.dragSegments_.push([segmentDataA, 1])

    const segmentDataB = {
      role,
      segment: [vertex, segment[1]],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index + 1
    }

    this.index_.insert(Extent.boundingExtent(segmentDataB.segment), segmentDataB)
    this.dragSegments_.push([segmentDataB, 0])
    this.ignoreNextSingleClick_ = true
  }


  removeVertex_ () {
    const dragSegments = this.dragSegments_
    const segmentsByFeature = {}
    let deleted = false
    let component, coordinates, dragSegment, geometry, i, index, left
    let newIndex, right, segmentData, uid
    for (i = dragSegments.length - 1; i >= 0; --i) {
      dragSegment = dragSegments[i]
      segmentData = dragSegment[0]
      uid = getUid(segmentData.feature)
      if (segmentData.depth) {
        // separate feature components
        uid += '-' + segmentData.depth.join('-')
      }

      if (!(uid in segmentsByFeature)) {
        segmentsByFeature[uid] = {}
      }

      if (dragSegment[1] === 0) {
        segmentsByFeature[uid].right = segmentData
        segmentsByFeature[uid].index = segmentData.index
      } else if (dragSegment[1] === 1) {
        segmentsByFeature[uid].left = segmentData
        segmentsByFeature[uid].index = segmentData.index + 1
      }
    }

    for (uid in segmentsByFeature) {
      right = segmentsByFeature[uid].right
      left = segmentsByFeature[uid].left
      index = segmentsByFeature[uid].index
      newIndex = index - 1

      if (left !== undefined) {
        segmentData = left
      } else {
        segmentData = right
      }

      if (newIndex < 0) {
        newIndex = 0
      }

      geometry = segmentData.geometry
      coordinates = geometry.getCoordinates()
      component = coordinates
      deleted = false

      switch (geometry.getType()) {
        case GeometryType.MULTI_LINE_STRING:
          if (coordinates[segmentData.depth[0]].length > 2) {
            coordinates[segmentData.depth[0]].splice(index, 1)
            deleted = true
          }
          break
        case GeometryType.LINE_STRING:
          if (coordinates.length > 2) {
            coordinates.splice(index, 1)
            deleted = true
          }
          break
        case GeometryType.MULTI_POLYGON:
          component = component[segmentData.depth[1]]
        /* falls through */
        case GeometryType.POLYGON:
          component = component[segmentData.depth[0]]
          if (component.length > 4) {
            if (index === component.length - 1) {
              index = 0
            }
            component.splice(index, 1)
            deleted = true
            if (index === 0) {
              // close the ring again
              component.pop()
              component.push(component[0])
              newIndex = component.length - 1
            }
          }
          break
        default:
        // pass
      }

      if (deleted) {

        this.setGeometryCoordinates_(segmentData.role, segmentData.feature, coordinates)
        const segments = []

        if (left !== undefined) {
          this.index_.remove(left)
          segments.push(left.segment[0])
        }

        if (right !== undefined) {
          this.index_.remove(right)
          segments.push(right.segment[1])
        }

        if (left !== undefined && right !== undefined) {
          const segmentDataA = {
            role: segmentData.role,
            depth: segmentData.depth,
            feature: segmentData.feature,
            geometry: segmentData.geometry,
            index: newIndex,
            segment: segments
          }

          this.index_.insert(
            Extent.boundingExtent(segmentDataA.segment),
            segmentDataA
          )
        }

        this.updateSegmentIndices_(geometry, index, segmentData.depth, -1)
        if (this.vertexFeature_) {
          this.overlay_.getSource().removeFeature(this.vertexFeature_)
          this.vertexFeature_ = null
        }

        dragSegments.length = 0
      }
    }

    return deleted
  }


  setGeometryCoordinates_ (role, feature, coordinates) {

    this.changingFeature_ = true
    const roles = this.special_.updateCoordinates(role, coordinates) || []

    // Re-index geometries for given roles:
    roles.forEach(role => {
      const nodes = []
      this.index_.forEach(function (node) {
        if (role === node.role) {
          nodes.push(node)
        }
      })

      nodes.forEach(node => this.index_.remove(node))
      const geometry = this.special_.geometry(role)
      const writer = indexWriters[geometry.getType()]
      if (writer) writer(this.index_, feature, geometry, role)
    })

    this.changingFeature_ = false
  }


  updateSegmentIndices_ (geometry, index, depth, delta) {
    this.index_.forEachInExtent(
      geometry.getExtent(),
      function (segmentDataMatch) {
        if (
          segmentDataMatch.geometry === geometry &&
          (depth === undefined ||
            segmentDataMatch.depth === undefined ||
            arrayEquals(segmentDataMatch.depth, depth)) &&
          segmentDataMatch.index > index
        ) {
          segmentDataMatch.index += delta
        }
      }
    )
  }


  removePoint () {
    if (
      this.lastPointerEvent_ &&
      this.lastPointerEvent_.type !== MapBrowserEventType.POINTERDRAG
    ) {
      const event = this.lastPointerEvent_
      this.willModifyFeatures_(event, this.dragSegments_)
      const removed = this.removeVertex_()
      this.dispatchEvent(
        new ModifyEvent(
          ModifyEventType.MODIFYEND,
          this.featuresBeingModified_,
          event
        )
      )

      this.featuresBeingModified_ = null
      return removed
    }

    return false
  }


  handlePointerMove_ (event) {
    this.lastPixel_ = event.pixel
    this.handlePointerAtPixel_(event.pixel, event.map, event.coordinate)
  }


  handlePointerAtPixel_ (pixel, map, coordinate) {
    const pixelCoordinate = coordinate || map.getCoordinateFromPixel(pixel)
    const projection = map.getView().getProjection()
    const sortByDistance = function (a, b) {
      return (
        projectedDistanceToSegmentDataSquared(pixelCoordinate, a, projection) -
        projectedDistanceToSegmentDataSquared(pixelCoordinate, b, projection)
      )
    }

    const viewExtent = Proj.fromUserExtent(
      Extent.createOrUpdateFromCoordinate(pixelCoordinate, tempExtent),
      projection
    )
    const buffer = map.getView().getResolution() * this.pixelTolerance_
    const box = Proj.toUserExtent(
      Extent.buffer(viewExtent, buffer, tempExtent),
      projection
    )

    const nodes = this.index_.getInExtent(box)

    if (!nodes.length) {
      if (this.vertexFeature_) {
        this.overlay_.getSource().removeFeature(this.vertexFeature_)
        this.vertexFeature_ = null
      }

      return
    }

    const node = nodes.sort(sortByDistance)[0]
    const closestSegment = node.segment
    let vertex = closestOnSegmentData(pixelCoordinate, node, projection)
    const vertexPixel = map.getPixelFromCoordinate(vertex)
    let dist = Coordinate.distance(pixel, vertexPixel)

    if (dist > this.pixelTolerance_) return /* nothing to do */

    const vertexSegments = {}
    vertexSegments[getUid(closestSegment)] = true

    if (!this.snapToPointer_) {
      this.delta_[0] = vertex[0] - pixelCoordinate[0]
      this.delta_[1] = vertex[1] - pixelCoordinate[1]
    }

    const pixel1 = map.getPixelFromCoordinate(closestSegment[0])
    const pixel2 = map.getPixelFromCoordinate(closestSegment[1])
    const squaredDist1 = Coordinate.squaredDistance(vertexPixel, pixel1)
    const squaredDist2 = Coordinate.squaredDistance(vertexPixel, pixel2)
    dist = Math.sqrt(Math.min(squaredDist1, squaredDist2))
    this.snappedToVertex_ = dist <= this.pixelTolerance_

    if (this.snappedToVertex_) {
      vertex = squaredDist1 > squaredDist2
        ? closestSegment[1]
        : closestSegment[0]
    }

    this.createOrUpdateVertexFeature_(vertex)

    const geometries = {}
    geometries[getUid(node.geometry)] = true
    for (let i = 1, ii = nodes.length; i < ii; ++i) {
      const segment = nodes[i].segment
      if (
        (Coordinate.equals(closestSegment[0], segment[0]) &&
          Coordinate.equals(closestSegment[1], segment[1])) ||
        (Coordinate.equals(closestSegment[0], segment[1]) &&
          Coordinate.equals(closestSegment[1], segment[0]))
      ) {
        const geometryUid = getUid(nodes[i].geometry)
        if (!(geometryUid in geometries)) {
          geometries[geometryUid] = true
          vertexSegments[getUid(segment)] = true
        }
      } else {
        break
      }
    }

    this.vertexSegments_ = vertexSegments
  }

  createOrUpdateVertexFeature_ (coordinates) {
    let vertexFeature = this.vertexFeature_
    if (!vertexFeature) {
      vertexFeature = new Feature(new Point(coordinates))
      this.vertexFeature_ = vertexFeature
      this.overlay_.getSource().addFeature(vertexFeature)
    } else {
      const geometry = vertexFeature.getGeometry()
      geometry.setCoordinates(coordinates)
    }
  }
}

export default Modify

const indexWriters = {}

indexWriters.Point = (index, feature, geometry, role) => {
  const coordinates = geometry.getCoordinates()

  const segmentData = {
    role,
    feature: feature,
    geometry: geometry,
    segment: [coordinates, coordinates]
  }

  index.insert(geometry.getExtent(), segmentData)
}

indexWriters.MultiPoint = (index, feature, geometry, role) => {
  const points = geometry.getCoordinates()
  for (let i = 0, ii = points.length; i < ii; ++i) {
    const coordinates = points[i]

    const segmentData = {
      role,
      feature: feature,
      geometry: geometry,
      depth: [i],
      index: i,
      segment: [coordinates, coordinates]
    }

    index.insert(geometry.getExtent(), segmentData)
  }
}

indexWriters.LineString = (index, feature, geometry, role) => {
  const coordinates = geometry.getCoordinates()
  for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    const segment = coordinates.slice(i, i + 2)

    const segmentData = {
      role,
      feature: feature,
      geometry: geometry,
      index: i,
      segment: segment
    }

    index.insert(Extent.boundingExtent(segment), segmentData)
  }
}

indexWriters.MultiLineString = (index, feature, geometry, role) => {
  const lines = geometry.getCoordinates()
  for (let j = 0, jj = lines.length; j < jj; ++j) {
    const coordinates = lines[j]
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2)

      const segmentData = {
        role,
        feature: feature,
        geometry: geometry,
        depth: [j],
        index: i,
        segment: segment
      }

      index.insert(Extent.boundingExtent(segment), segmentData)
    }
  }
}

indexWriters.Polygon = (index, feature, geometry, role) => {
  const rings = geometry.getCoordinates()
  for (let j = 0, jj = rings.length; j < jj; ++j) {
    const coordinates = rings[j]
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2)

      const segmentData = {
        role,
        feature: feature,
        geometry: geometry,
        depth: [j],
        index: i,
        segment: segment
      }

      index.insert(Extent.boundingExtent(segment), segmentData)
    }
  }
}

indexWriters.MultiPolygon = (index, feature, geometry, role) => {
  const polygons = geometry.getCoordinates()
  for (let k = 0, kk = polygons.length; k < kk; ++k) {
    const rings = polygons[k]
    for (let j = 0, jj = rings.length; j < jj; ++j) {
      const coordinates = rings[j]
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const segment = coordinates.slice(i, i + 2)

        const segmentData = {
          role,
          feature: feature,
          geometry: geometry,
          depth: [j, k],
          index: i,
          segment: segment
        }

        index.insert(Extent.boundingExtent(segment), segmentData)
      }
    }
  }
}

indexWriters.GeometryCollection = (index, feature, geometry, role) => {
  const geometries = geometry.getGeometriesArray()
  for (let i = 0; i < geometries.length; ++i) {
    const geometry = geometries[i]
    const writer = indexWriters[geometry.getType()]
    writer(index, feature, geometry, role)
  }
}

const segmentUpdaters = {
  Point: (vertex, [segmentData]) => {
    const segment = segmentData.segment
    const coordinates = vertex
    segment[0] = vertex
    segment[1] = vertex
    return coordinates
  },
  MultiPoint: (vertex, [segmentData]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[segmentData.index] = vertex
    segment[0] = vertex
    segment[1] = vertex
    return coordinates
  },
  LineString: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  MultiLineString: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const geometry = segmentData.geometry
    const depth = segmentData.depth
    const coordinates = geometry.getCoordinates()
    coordinates[depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  Polygon: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const depth = segmentData.depth
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  },
  MultiPolygon: (vertex, [segmentData, index]) => {
    const segment = segmentData.segment
    const depth = segmentData.depth
    const geometry = segmentData.geometry
    const coordinates = geometry.getCoordinates()
    coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex
    segment[index] = vertex
    return coordinates
  }
}
