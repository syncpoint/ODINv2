import * as Events from './events'
import { updateVertex, removeVertex, insertVertex } from './writers'

export const loaded = (handleClick = false) => ({
  pointermove: pointer => {
    const [node, coordinate] = pointer.pick()
    return [loaded(), node ? Events.coordinate(coordinate) : null]
  },

  // Hide vertex feature on SHIFT key down.
  keydown: pointer => pointer.shiftKey
    ? [loaded(), Events.coordinate(null)]
    : null,

  // Optionally handle click (after selecting feature).
  click: pointer => {
    if (handleClick) {
      const [node, coordinate] = pointer.pick()
      return [loaded(), node ? Events.coordinate(coordinate) : null]
    } else return null
  },

  /**
   * No coordinate: remain in loaded state.
   * Segment vertex at index 0 or 1: dragging state.
   * Point on segment (no vertex index): insert state.
   */
  pointerdown: pointer => {
    const [node, coordinate, index] = pointer.pick()

    // Mark event as handled if we have a coordinate:
    if (coordinate) pointer.stopPropagation()
    else return [loaded(), null]

    const feature = node.feature
    const clone = feature.clone()

    const state = index !== null
      ? pointer.altKey
        ? remove(node, index)
        : drag(feature, clone, updateVertex(node, index))
      : insert(node)

    return [state, Events.coordinate(coordinate)]
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

const insert = node => ({
  pointerdrag: pointer => {
    const coordinate = pointer.closestOnSegment(node.segment)
    const distance = pointer.pixelDistance(coordinate)

    if (pointer.withinTolerance(distance)) {
      return [insert(node), Events.coordinate(pointer.coordinate)]
    } else {
      const coordinate = pointer.coordinate
      const feature = node.feature
      const clone = feature.clone()
      const [coordinates, update] = insertVertex(node, coordinate)
      feature.coordinates = coordinates
      return [drag(feature, clone, update), Events.coordinate(coordinate)]
    }
  }
})

const remove = (node, index) => ({
  pointerup: () => {
    const feature = node.feature
    const clone = feature.clone()
    const coordinates = removeVertex(node, index)
    feature.coordinates = coordinates
    feature.commit()
    // TODO: emit update event

    // Remain in REMOVE state and wait for next click event:
    return [remove(node, index), Events.update(clone, feature)]
  },

  // Click event is handled again in LOADED state
  // with upcoming RBush event.
  click: () => [loaded(true), null]
})
