import * as Events from './events'
import { updateVertex, removeVertex, insertVertex } from './writers'

export const loaded = (handleClick = false) => ({
  pointermove: pointer => {
    const [segment, coordinate] = pointer.pick()
    return [loaded(), segment ? Events.coordinate(coordinate) : null]
  },

  // Hide vertex feature on SHIFT key down.
  keydown: pointer => pointer.shiftKey
    ? [loaded(), Events.coordinate(null)]
    : null,

  // Optionally handle click (after selecting feature).
  click: pointer => {
    if (handleClick) {
      const [segment, coordinate] = pointer.pick()
      return [loaded(), segment ? Events.coordinate(coordinate) : null]
    } else return null
  },

  /**
   * No coordinate: remain in loaded state.
   * Segment vertex at index 0 or 1: dragging state.
   * Point on segment (no vertex index): insert state.
   */
  pointerdown: pointer => {
    const [segment, coordinate, index] = pointer.pick()

    // Mark event as handled if we have a coordinate:
    if (coordinate) pointer.stopPropagation()
    else return [loaded(), null]

    const feature = segment.feature
    const clone = feature.clone()

    const state = index !== null
      ? pointer.altKey
        ? remove(segment, index)
        : drag(feature, clone, updateVertex(segment, index))
      : insert(segment)

    return [state, Events.coordinate(coordinate)]
  },

  dblclick: pointer => {
    const [segment, coordinate, index] = pointer.pick()
    if (index === null) return null

    const feature = segment.feature
    const clone = feature.clone()
    const coordinates = removeVertex(segment, index)
    feature.coordinates = coordinates
    feature.commit()

    return [loaded(), Events.update(clone, feature)]
  }
})

const drag = (feature, clone, update) => ({
  pointerdrag: pointer => {

    // TODO: get rid of originalEvent (metaKey, ctrlKey)
    const [coordinates, coordinate] = update(pointer.coordinate, pointer.originalEvent)

    // Side-effect: Update feature coordinates and thus geometry.
    feature.coordinates = coordinates
    return [drag(feature, clone, update), Events.coordinate(coordinate)]
  },
  pointerup: (_, event) => {
    feature.commit()
    return [loaded(), Events.update(clone, feature)]
  }
})

const insert = segment => ({
  pointerdrag: pointer => {
    const coordinate = pointer.closestOnSegment(segment.vertices)
    const distance = pointer.pixelDistance(coordinate)

    if (pointer.withinTolerance(distance)) {
      return [insert(segment), Events.coordinate(pointer.coordinate)]
    } else {
      const coordinate = pointer.coordinate
      const feature = segment.feature
      const clone = feature.clone()
      const [coordinates, update] = insertVertex(segment, coordinate)
      feature.coordinates = coordinates
      return [drag(feature, clone, update), Events.coordinate(coordinate)]
    }
  }
})

const remove = (segment, index) => ({
  pointerup: () => {
    const feature = segment.feature
    const clone = feature.clone()
    const coordinates = removeVertex(segment, index)
    feature.coordinates = coordinates
    feature.commit()
    // TODO: emit update event

    // Remain in REMOVE state and wait for next click event:
    return [remove(segment, index), Events.update(clone, feature)]
  },

  // Click event is handled again in LOADED state
  // with upcoming RBush event.
  click: () => [loaded(true), null]
})
