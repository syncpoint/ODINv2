import { Hooks } from './hooks'
import { spatialIndex } from './writers'

/**
 * IDLE: No or multiple features selected.
 */
export const idleState = () => ({

  keydown: () => {
    // Hide pointer when feature was deleted:
    return { state: idleState(), coordinate: null }
  }
})

/**
 * LOADED: Single feature is selected for editing.
 * Geometry is index in R-bush.
 */
export const loadedState = (rbush, handleClick = false) => {
  const conditions = (message, node, index) => {
    const layout = node && node.descriptor && node.descriptor.layout
    const maxPoints = node && node.descriptor && node.descriptor.maxPoints
    const canRemove = () => index !== null && message.removeCondition() && layout !== 'rectangle'

    const mustIgnore = () => message.originalEvent.shiftKey
    const canDrag = () => index !== null
    const canInsert = () => index === null &&
      layout !== 'rectangle' &&
      layout !== 'orbit' &&
      maxPoints !== 2

    const filter = coordinate => !mustIgnore() && (canDrag() || canInsert())
      ? coordinate
      : null

    return {
      mustIgnore,
      canRemove,
      canDrag,
      canInsert,
      filter
    }
  }

  const handlers = {
    keydown: message => {
      // Hide pointer if SHIFT is pressed.
      // NOTE: Map does not emit keyup event to show pointer again.
      const state = loadedState(rbush)
      return message.originalEvent.shiftKey
        ? { state, coordinate: null }
        : { state }
    },

    pointermove: message => {
      const node = message.closestSegment(rbush)
      const { coordinate, index } = message.coordinateWithinTolerance(node)
      const cond = conditions(message, node, index)
      const state = loadedState(rbush)
      return { state, coordinate: cond.filter(coordinate) }
    },

    pointerdown: message => {
      const node = message.closestSegment(rbush)
      const { coordinate, index } = message.coordinateWithinTolerance(node)
      const cond = conditions(message, node, index)

      const ignore = () => {
        return {
          state: loadedState(rbush),
          coordinate: null,
          propagate: true
        }
      }

      const loaded = () => {
        return {
          state: loadedState(rbush),
          coordinate: cond.filter(coordinate),
          propagate: true
        }
      }

      const remove = () => {
        return {
          state: removeState(node, index),
          coordinate: cond.filter(coordinate),
          propagate: false,
          feature: node.feature,
          type: 'modifystart'
        }
      }

      const drag = () => {
        return {
          state: lockedState(node.feature, updateVertex(node, index)),
          coordinate: cond.filter(coordinate),
          propagate: false,
          feature: node.feature,
          type: 'modifystart'
        }
      }

      const engage = () => {
        return {
          state: engagedState(rbush, node),
          coordinate,
          propagate: false,
          feature: node.feature,
          type: 'modifystart'
        }
      }

      if (cond.mustIgnore()) return ignore()
      else if (!coordinate) return loaded()
      else if (cond.canRemove()) return remove()
      else if (cond.canDrag()) return drag()
      else if (cond.canInsert()) return engage()
      else return loaded()
    }
  }

  // Optionally handle (last) `click` event after feature was selected.
  if (handleClick) {
    handlers.click = message => {
      const node = message.closestSegment(rbush)
      const { coordinate, index } = message.coordinateWithinTolerance(node)
      const cond = conditions(message, node, index)
      const state = loadedState(rbush)
      return { state, coordinate: cond.filter(coordinate), propagate: false }
    }
  }

  return handlers
}

/**
 *
 */
const removeState = (node, index) => ({
  pointerup: () => {
    const feature = node.feature
    const coordinates = removeVertex(node, index)
    feature.coordinates = coordinates
    const state = loadedState(spatialIndex(feature))
    return { state, feature, type: 'modifyend', coordinate: null, propagate: false }
  }
})

/**
 *
 */
const engagedState = (rbush, node) => {

  return {
    pointerdrag: message => {
      const coordinate = message.pointOnSegment(node.segment)
      const distance = message.pixelDistance(coordinate)

      if (message.withinTolerance(distance)) {
        const state = engagedState(rbush, node)
        return { state, coordinate, propagate: false }
      } else {
        const coordinate = message.pointerCoordinate
        const feature = node.feature
        const [coordinates, update] = insertVertex(node, coordinate)
        feature.coordinates = coordinates

        const state = lockedState(feature, update)
        return { state, coordinate, propagate: false }
      }
    },

    pointerup: () => {
      const state = loadedState(rbush, true)
      return { state, propagate: false }
    }
  }
}

/**
 * LOCKED: Locked to an existing segment vertex.
 */
const lockedState = (feature, update) => {
  return {
    pointerdrag: message => {
      const { pointerCoordinate, originalEvent } = message

      const [coordinates, coordinate] = update(pointerCoordinate, originalEvent)
      feature.coordinates = coordinates
      const state = lockedState(feature, update)
      return { state, coordinate, propagate: false }
    },

    pointermove: () => {
      // Prevent pointermove from being delegated to translate interaction.
      const state = lockedState(feature, update)
      return { state, propagate: false }
    },

    pointerdown: () => {
      const state = lockedState(feature, update)
      return { state, feature, type: 'modifystart', propagate: false }
    },

    pointerup: () => {
      const state = loadedState(spatialIndex(feature), true)
      return { state, feature, type: 'modifyend', propagate: false }
    }
  }
}

const close = (ring, index) => {
  if (index === 0) ring[ring.length - 1] = ring[0]
  else if (index >= ring.length - 1) ring[0] = ring[ring.length - 1]
}

const updateVertex = (node, index) => {
  const { geometry, depth } = node
  const offset = node.index + index
  const hooks = Hooks.get(node, offset)

  return (coordinate, event) => {
    let coordinates = geometry.getCoordinates()
    const projected = hooks.project(coordinate, event)

    switch (geometry.getType()) {
      case 'Point':
        coordinates = projected
        break
      case 'MultiPoint':
        coordinates[node.index] = projected
        break
      case 'LineString':
        coordinates[offset] = projected
        break
      case 'MultiLineString':
        coordinates[depth[0]][offset] = projected
        break
      case 'Polygon':
        coordinates[depth[0]][offset] = projected
        close(coordinates[depth[0]], offset)
        break
      case 'MultiPolygon':
        coordinates[depth[0]][depth[1]][offset] = projected
        close(coordinates[depth[0]][depth[1]], offset)
        break
    }

    coordinates = hooks.coordinates(coordinates, event)
    return [coordinates, projected]
  }
}

const insertVertex = (node, coordinate) => {
  const { geometry, depth } = node
  const offset = node.index + 1
  const hooks = Hooks.get(node, offset)
  const coordinates = geometry.getCoordinates()

  switch (geometry.getType()) {
    case 'LineString':
      coordinates.splice(offset, 0, coordinate)
      break
    case 'MultiLineString':
      coordinates[depth[0]].splice(offset, 0, coordinate)
      break
    case 'Polygon':
      coordinates[depth[0]].splice(offset, 0, coordinate)
      close(coordinates[depth[0]], offset)
      break
    case 'MultiPolygon':
      coordinates[depth[0]][depth[1]].splice(offset, 0, coordinate)
      close(coordinates[depth[0]][depth[1]], offset)
      break
  }

  return [hooks.coordinates(coordinates), updateVertex(node, 1)]
}

const removeVertex = (node, index) => {
  const { geometry, depth } = node
  const offset = node.index + index
  const hooks = Hooks.get(node, offset)
  const coordinates = geometry.getCoordinates()

  switch (geometry.getType()) {
    case 'LineString':
      coordinates.splice(offset, 1)
      break
    case 'MultiLineString':
      coordinates[depth[0]].splice(offset, 1)
      break
    case 'Polygon':
      coordinates[depth[0]].splice(offset, 1)
      close(coordinates[depth[0]], offset)
      break
    case 'MultiPolygon':
      coordinates[depth[0]][depth[1]].splice(offset, 1)
      close(coordinates[depth[0]][depth[1]], offset)
      break
  }

  return hooks.coordinates(coordinates)
}
