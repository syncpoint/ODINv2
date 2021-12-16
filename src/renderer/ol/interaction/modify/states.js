import { altKeyOnly, shiftKeyOnly } from 'ol/events/condition'
import * as Events from './events'
import { updateVertex, removeVertex, insertVertex } from './writers'

/**
 * Feature is selected for modification.
 */
export const selected = (handleClick = false) => ({
  pointermove: pointer => {
    const { segment, coordinate } = pointer.pick()
    return [selected(), segment ? Events.coordinate(coordinate) : null]
  },

  // Hide vertex feature on SHIFT key down.
  keydown: pointer => pointer.condition(shiftKeyOnly)
    ? [selected(), Events.coordinate(null)]
    : null,

  // Optionally handle click (after selecting feature).
  click: pointer => {
    if (handleClick) {
      const { segment, coordinate } = pointer.pick()
      return [selected(), segment ? Events.coordinate(coordinate) : null]
    } else return null
  },

  /**
   * No coordinate: remain in loaded state.
   * Segment vertex at index 0 or 1: dragging state.
   * Point on segment (no vertex index): insert state.
   */
  pointerdown: pointer => {
    if (pointer.condition(shiftKeyOnly)) return null

    const { segment, coordinate, index } = pointer.pick()

    // Mark event as handled if we have a coordinate:
    if (coordinate) pointer.stopPropagation()
    else return [selected(), null]

    const feature = segment.feature
    const clone = feature.clone()

    const state = Number.isInteger(index)
      ? pointer.condition(altKeyOnly)
        ? remove(segment, index)
        : drag(feature, clone, updateVertex(segment, index))
      : insert(segment)

    return [state, Events.coordinate(coordinate)]
  },

  dblclick: pointer => {
    const { segment, index } = pointer.pick()
    if (!Number.isInteger(index)) return null

    const feature = segment.feature
    const clone = feature.clone()
    const coordinates = removeVertex(segment, index)
    feature.coordinates = coordinates
    feature.commit()

    const events = [
      Events.update(clone, feature),
      Events.coordinate(null)
    ]

    return [selected(), events]
  }
})

/**
 * Drag vertex state.
 */
const drag = (feature, clone, update) => ({

  pointerdrag: pointer => {
    const [coordinates, coordinate] = update(pointer.coordinate, pointer.condition)

    // Side-effect: Update feature coordinates and thus geometry.
    feature.coordinates = coordinates
    return [drag(feature, clone, update), Events.coordinate(coordinate)]
  },
  pointerup: (_, event) => {
    feature.commit()
    return [selected(), Events.update(clone, feature)]
  }
})


/**
 * Insert vertex state.
 */
const insert = segment => ({
  pointerdrag: pointer => {
    const distance = pointer.pixelDistance(segment.vertices)

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
  },

  pointerup: () => [selected()]
})

/**
 * Remove vertex state.
 */
const remove = (segment, index) => ({
  pointerup: () => {
    const feature = segment.feature
    const clone = feature.clone()
    const coordinates = removeVertex(segment, index)
    feature.coordinates = coordinates
    feature.commit()

    // Remain in REMOVE state and wait for next click event:
    return [remove(segment, index), Events.update(clone, feature)]
  },

  // Click event is handled again in LOADED state
  // with upcoming RBush event.
  click: () => [selected(true), Events.coordinate(null)]
})
