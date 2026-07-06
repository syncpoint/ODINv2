import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer, Image as ImageLayer } from 'ol/layer'
import ImageCanvas from 'ol/source/ImageCanvas'
import { Select } from 'ol/interaction'
import { unByKey } from 'ol/Observable'
import { toLonLat } from 'ol/proj'
import { containsExtent } from 'ol/extent'
import uuid from '../../../../shared/uuid'
import * as ID from '../../../ids'
import { ElevationService } from '../../../model/ElevationService'
import { ViewshedEngine, VISIBLE, HIDDEN, NO_DATA } from './engine'
import { observerPointStyle } from '../line-of-sight/style'

const ORIGINATOR_ID = uuid()
const AOS_DOC_TYPE = 'aos'

export const DEFAULT_RADIUS_M = 2500
export const MAX_RADIUS_M = 10000
const DEFAULT_OBSERVER_HEIGHT_M = 2
const DEFAULT_TARGET_HEIGHT_M = 2

const VISIBLE_RGBA = [40, 170, 60, 100]
const HIDDEN_RGBA = [200, 40, 40, 100]

export default ({ map, services }) => {
  const elevationService = new ElevationService()
  const engine = new ViewshedEngine()

  // ────────────────────────────────────────────────────────────
  // Raster overlay: one ImageCanvas source composites the live
  // preview and all persisted viewsheds into the current view.
  // ────────────────────────────────────────────────────────────

  // aosId -> { doc, canvas, extent, feature }
  const entries = new Map()
  let preview = null // { canvas, extent }

  const composite = document.createElement('canvas')

  const canvasFunction = (extent, resolution, pixelRatio, size) => {
    composite.width = size[0]
    composite.height = size[1]
    const ctx = composite.getContext('2d')
    const scale = pixelRatio / resolution
    const draw = entry => {
      if (!entry) return
      const [minX, minY, maxX, maxY] = entry.extent
      ctx.drawImage(
        entry.canvas,
        (minX - extent[0]) * scale,
        (extent[3] - maxY) * scale,
        (maxX - minX) * scale,
        (maxY - minY) * scale
      )
    }
    entries.forEach(draw)
    draw(preview)
    return composite
  }

  const rasterSource = new ImageCanvas({ canvasFunction, ratio: 1 })
  map.addLayer(new ImageLayer({ source: rasterSource }))

  const vectorSource = new VectorSource()
  const vector = new VectorLayer({ source: vectorSource, style: null })
  vector.set('selectable', true)
  map.addLayer(vector)

  /**
   * Render a mask window into a colorized canvas, clipped to the
   * circular radius around the observer.
   */
  const colorize = (result, observerCell, radius) => {
    const { mask, x0, y0, w, h } = result
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(w, h)
    const data = image.data
    const cx = observerCell[0] - x0
    const cy = observerCell[1] - y0
    const r2 = radius * radius
    for (let y = 0; y < h; y++) {
      const dy = y - cy
      for (let x = 0; x < w; x++) {
        const dx = x - cx
        if (dx * dx + dy * dy > r2) continue
        const value = mask[y * w + x]
        if (value !== VISIBLE && value !== HIDDEN) continue
        const rgba = value === VISIBLE ? VISIBLE_RGBA : HIDDEN_RGBA
        const o = (y * w + x) * 4
        data[o] = rgba[0]; data[o + 1] = rgba[1]; data[o + 2] = rgba[2]; data[o + 3] = rgba[3]
      }
    }
    ctx.putImageData(image, 0, 0)
    return canvas
  }

  const windowExtent = (grid, { x0, y0, w, h }) => {
    const [gx, gy] = grid.origin
    const res = grid.resolution
    return [gx + x0 * res, gy - (y0 + h) * res, gx + (x0 + w) * res, gy - y0 * res]
  }

  // ────────────────────────────────────────────────────────────
  // Grid management
  // ────────────────────────────────────────────────────────────

  let grid = null
  let gridExtent = null

  const sanitize = data => {
    for (let i = 0; i < data.length; i++) if (Number.isNaN(data[i])) data[i] = NO_DATA
  }

  // Radius in projection units: Web Mercator inflates ground distances
  // by 1/cos(lat).
  const projectedRadius = (coordinate, radiusM) => {
    const lat = toLonLat(coordinate)[1] * Math.PI / 180
    return radiusM / Math.max(0.087, Math.cos(lat)) // clamp beyond ±85°
  }

  const requiredExtent = (coordinate, radiusM) => {
    const r = projectedRadius(coordinate, radiusM) * 1.05
    return [coordinate[0] - r, coordinate[1] - r, coordinate[0] + r, coordinate[1] + r]
  }

  const ensureGrid = async (coordinate, radiusM) => {
    const required = requiredExtent(coordinate, radiusM)
    if (grid && containsExtent(gridExtent, required)) return grid
    const fetched = await elevationService.getGrid(required)
    if (!fetched) return null
    sanitize(fetched.data)
    grid = fetched
    gridExtent = [
      grid.origin[0],
      grid.origin[1] - grid.height * grid.resolution,
      grid.origin[0] + grid.width * grid.resolution,
      grid.origin[1]
    ]
    return grid
  }

  /**
   * Compute viewshed for observer coordinate; returns everything the
   * render side needs, or null (no data at observer, no terrain, ...).
   */
  const computeViewshed = async (coordinate, doc) => {
    const radiusM = Math.min(doc.radius ?? DEFAULT_RADIUS_M, MAX_RADIUS_M)
    const g = await ensureGrid(coordinate, radiusM)
    if (!g) return null

    const res = g.resolution
    const ox = Math.floor((coordinate[0] - g.origin[0]) / res)
    const oy = Math.floor((g.origin[1] - coordinate[1]) / res)
    const lat = toLonLat(coordinate)[1] * Math.PI / 180
    const metersPerCell = res * Math.max(0.087, Math.cos(lat))
    const radius = Math.max(2, Math.round(radiusM / metersPerCell))

    const result = await engine.compute(g, {
      ox,
      oy,
      radius,
      metersPerCell,
      observerHeight: doc.observerHeight ?? DEFAULT_OBSERVER_HEIGHT_M,
      targetHeight: doc.targetHeight ?? DEFAULT_TARGET_HEIGHT_M
    })
    if (!result) return null

    return {
      canvas: colorize(result, [ox, oy], radius),
      extent: windowExtent(g, result)
    }
  }

  // ────────────────────────────────────────────────────────────
  // Persisted AoS rendering (store-driven)
  // ────────────────────────────────────────────────────────────

  const removePersistedAos = (aosId) => {
    const entry = entries.get(aosId)
    if (!entry) return
    if (entry.feature) vectorSource.removeFeature(entry.feature)
    entries.delete(aosId)
    rasterSource.changed()
  }

  const sameCoord = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

  const docChanged = (a, b) =>
    !a || !b ||
    a.radius !== b.radius ||
    a.observerHeight !== b.observerHeight ||
    a.targetHeight !== b.targetHeight ||
    !sameCoord(a.observer, b.observer)

  const renderPersistedAos = async (aosId, doc) => {
    if (!elevationService.setSource(map)) return
    if (!doc || !doc.observer) return

    const rendered = await computeViewshed(doc.observer, doc)
    if (!rendered) return
    if (entries.has(aosId)) removePersistedAos(aosId)

    const feature = new Feature(new Point(doc.observer))
    feature.setStyle(observerPointStyle)
    feature.setId(aosId)
    vectorSource.addFeature(feature)

    entries.set(aosId, { doc, ...rendered, feature })
    rasterSource.changed()
  }

  const tryInitialLoad = async () => {
    if (!elevationService.setSource(map)) return false
    const tuples = await services.store.tuples(ID.AOS_SCOPE)
    for (const [id, doc] of tuples) {
      const existing = entries.get(id)
      if (!existing || docChanged(existing.doc, doc)) renderPersistedAos(id, doc)
    }
    return true
  }

  ;(async () => {
    if (await tryInitialLoad()) return
    const key = map.getLayers().on('add', async () => {
      if (await tryInitialLoad()) unByKey(key)
    })
  })()

  services.store.on('batch', ({ operations }) => {
    for (const op of operations) {
      if (!ID.isAosId(op.key)) continue
      if (op.type === 'del') {
        removePersistedAos(op.key)
        continue
      }
      const existing = entries.get(op.key)
      if (existing && !docChanged(existing.doc, op.value)) continue
      renderPersistedAos(op.key, op.value)
    }
  })

  // ────────────────────────────────────────────────────────────
  // Tool lifecycle: viewshed follows the cursor, click to fix
  // ────────────────────────────────────────────────────────────

  /** @type {'idle' | 'tracking'} */
  let mode = 'idle'
  let clickKey = null
  let moveKey = null
  let busy = false
  let pending = null
  let generation = 0

  const liveDoc = {
    radius: DEFAULT_RADIUS_M,
    observerHeight: DEFAULT_OBSERVER_HEIGHT_M,
    targetHeight: DEFAULT_TARGET_HEIGHT_M
  }

  const setCursor = value => {
    const viewport = map.getViewport()
    if (viewport) viewport.style.cursor = value
  }

  const showOSD = message => services.emitter.emit('osd', { message, cell: 'A3' })

  const selectInteraction = () =>
    map.getInteractions().getArray().find(i => i instanceof Select)

  const setSelectActive = active => {
    const select = selectInteraction()
    if (select) select.setActive(active)
  }

  const clearPreview = () => {
    preview = null
    rasterSource.changed()
  }

  const showPreview = async (coordinate) => {
    const gen = generation
    const rendered = await computeViewshed(coordinate, liveDoc)
    if (gen !== generation) return
    preview = rendered
    rasterSource.changed()
  }

  const track = async (coordinate) => {
    if (busy) {
      pending = coordinate
      return
    }
    busy = true
    try {
      await showPreview(coordinate)
      while (pending) {
        const next = pending
        pending = null
        await showPreview(next)
      }
    } finally {
      busy = false
    }
  }

  const detachMapListeners = () => {
    if (clickKey) { unByKey(clickKey); clickKey = null }
    if (moveKey) { unByKey(moveKey); moveKey = null }
  }

  const reset = () => {
    detachMapListeners()
    clearPreview()
    mode = 'idle'
    pending = null
    generation++
    setCursor('')
    setSelectActive(true)
    showOSD('')
  }

  const finalise = async (coordinate) => {
    const doc = {
      type: AOS_DOC_TYPE,
      observer: coordinate,
      radius: liveDoc.radius,
      observerHeight: liveDoc.observerHeight,
      targetHeight: liveDoc.targetHeight
    }
    // Render as persisted entry; store insert echoes back via batch but
    // docChanged() will skip the redundant recompute.
    const aosId = ID.aosId()
    await renderPersistedAos(aosId, doc)
    services.store.insert([[aosId, doc]])
  }

  const onPointerMove = (event) => {
    if (mode !== 'tracking' || event.dragging) return
    track(event.coordinate)
  }

  const onSingleClick = async (event) => {
    if (mode !== 'tracking') return
    mode = 'idle'
    detachMapListeners()
    setCursor('')
    setSelectActive(true)
    generation++
    clearPreview()
    showOSD('')
    await finalise(event.coordinate)
  }

  const start = () => {
    reset()
    if (!elevationService.setSource(map)) {
      showOSD('No terrain layer available')
      setTimeout(() => showOSD(''), 3000)
      return
    }
    engine.init().then(backend => {
      if (backend === 'cpu') console.warn('[AoS] WebGPU unavailable — CPU fallback active')
    })
    mode = 'tracking'
    setCursor('crosshair')
    setSelectActive(false)
    showOSD('AoS: move cursor to preview, click to place observer')
    clickKey = map.on('singleclick', onSingleClick)
    moveKey = map.on('pointermove', onPointerMove)
  }

  services.emitter.on('AREA_OF_SIGHT', () => {
    services.emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    start()
  })

  services.emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId !== ORIGINATOR_ID) reset()
  })
}
