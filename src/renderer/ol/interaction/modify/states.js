import * as R from 'ramda'
import { altKeyOnly, shiftKeyOnly } from 'ol/events/condition'
import * as Events from './events'
import { updateVertex, removeVertex, insertVertex } from './writers'

const ignoreEvent = event => event.condition(shiftKeyOnly)
const removeEvent = event => event.condition(altKeyOnly)
const offTarget = ({ coordinate }) => R.isNil(coordinate)
const onTarget = pick => R.not(offTarget(pick))
const onVertex = pick => onTarget(pick) && Number.isInteger(pick.index)
const onSegment = pick => onTarget(pick) && R.isNil(pick.index)

const coordinateEvent = ({ coordinate }) => Events.coordinate(coordinate)


/**
 * Feature is selected for modification.
 */
export const selected = (handleClick = false) => ({
  pointermove: pointer => [selected(), coordinateEvent(pointer.pick())],

  // Hide vertex feature on SHIFT key down.
  keydown: pointer => ignoreEvent(pointer)
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
   * No coordinate: remain in SELECTED state.
   * Segment vertex at index 0 or 1: dragging state.
   * Point on segment (no vertex index): insert state.
   */
  pointerdown: pointer => {
    if (ignoreEvent(pointer)) return null

    const pick = pointer.pick()

    // Mark event as handled if we have a coordinate:
    if (onTarget(pick)) pointer.stopPropagation()

    // drag, remove and insert are mutually exclusive:
    const removeMode = pick => onVertex(pick) && removeEvent(pointer)
    const dragMode = pick => onVertex(pick) && R.not(removeEvent(pointer))
    const insertMode = pick => onSegment(pick) && R.not(removeEvent(pointer))

    const removeVertex = pick => [remove(pick), coordinateEvent(pick)]
    const insertVertex = pick => [insert(pick), coordinateEvent(pick)]
    const dragVertex = ({ segment, coordinate, index }) => {
      const feature = segment.feature
      const events = [Events.coordinate(coordinate), Events.modifystart(feature)]
      return [drag(feature, updateVertex(segment, index)), events]
    }

    return R.cond([
      [offTarget, R.always([selected(), null])],
      [removeMode, removeVertex],
      [insertMode, insertVertex],
      [dragMode, dragVertex]
    ])(pick)
  },

  dblclick: pointer => {
    const pick = pointer.pick()
    if (R.not(onVertex(pick))) return null

    const { segment, index } = pick
    const feature = segment.feature
    const modifystart = Events.modifystart(feature)

    const coordinates = removeVertex(segment, index)
    feature.coordinates = coordinates
    feature.commit()

    const modifyend = Events.modifyend(feature)

    const events = [
      modifystart,
      modifyend,
      Events.coordinate(null)
    ]

    return [selected(), events]
  }
})


/**
 * Drag vertex state.
 */
const drag = (feature, update) => ({

  pointerdrag: pointer => {
    const [coordinates, coordinate] = update(pointer.coordinate, pointer.condition)

    // Side-effect: Update feature coordinates and thus geometry.
    feature.coordinates = coordinates
    return [drag(feature, update), Events.coordinate(coordinate)]
  },

  pointerup: () => {
    feature.commit()
    return [selected(), Events.modifyend(feature, feature)]
  }
})


/**
 * Insert vertex state.
 */
const insert = pick => {
  const { segment } = pick

  return {
    pointerdrag: pointer => {
      const distance = pointer.pixelDistance(segment.vertices)

      if (pointer.withinTolerance(distance)) {
        return [insert(pick), Events.coordinate(pointer.coordinate)]
      } else {
        const coordinate = pointer.coordinate
        const feature = segment.feature
        const [coordinates, update] = insertVertex(segment, coordinate)
        const modifystart = Events.modifystart(feature)
        feature.coordinates = coordinates
        return [drag(feature, update), [modifystart, Events.coordinate(coordinate)]]
      }
    },

    pointerup: () => [selected()]
  }
}


/**
 * Remove vertex state.
 */
const remove = pick => {
  const { segment, index } = pick

  return {
    pointerup: () => {
      const feature = segment.feature
      const clone = feature.clone()
      const coordinates = removeVertex(segment, index)
      feature.coordinates = coordinates
      feature.commit()

      // Remain in REMOVE state and wait for next click event:
      return [remove(pick), Events.update(clone, feature)]
    },

    // Click event is handled again in SELECTED state
    // with upcoming RBush event.
    click: () => [selected(true), Events.coordinate(null)]
  }
}
