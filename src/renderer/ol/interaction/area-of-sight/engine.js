/* global GPUBufferUsage, GPUMapMode */

/**
 * Viewshed (Area-of-Sight) engine.
 *
 * Algorithm: R2 — one ray per perimeter cell of the square ring around
 * the observer, tracking the running maximum terrain slope along each
 * ray (with earth-curvature/refraction correction). O(cells) total work.
 *
 * Primary backend is a WebGPU compute shader (one thread per ray,
 * 10 km @ 10 m in single-digit milliseconds — see spikes/aos). The CPU
 * implementation is the reference for tests and the fallback when no
 * GPU adapter is available.
 *
 * Mask values: 0 unknown/outside, 1 visible, 2 hidden.
 */

export const VISIBLE = 1
export const HIDDEN = 2

// Grid cells with no elevation data carry this sentinel (NaN is not
// portable into WGSL — fast-math may optimize NaN comparisons away).
export const NO_DATA = -100000

const EARTH_RADIUS_M = 6371008.8
const REFRACTION_K = 0.13
export const CURVATURE = 1 / (2 * (EARTH_RADIUS_M / (1 - REFRACTION_K)))

/**
 * Clamped window of the viewshed square around the observer.
 */
export const maskWindow = (width, height, ox, oy, radius) => {
  const x0 = Math.max(0, ox - radius)
  const y0 = Math.max(0, oy - radius)
  const x1 = Math.min(width - 1, ox + radius)
  const y1 = Math.min(height - 1, oy + radius)
  return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/**
 * CPU reference implementation.
 *
 * @param {{data: Float32Array, width: number, height: number}} grid
 * @param {object} params - observer cell (ox, oy), radius [cells],
 *   metersPerCell (true ground size, Mercator-corrected),
 *   observerHeight/targetHeight [m]
 * @returns {null | {mask: Uint8Array, x0, y0, w, h}} window-relative mask
 */
export const viewshedCPU = (grid, { ox, oy, radius, metersPerCell, observerHeight, targetHeight }) => {
  const { data, width, height } = grid
  if (ox < 0 || oy < 0 || ox >= width || oy >= height) return null
  const ground = data[oy * width + ox]
  if (ground <= NO_DATA) return null

  const window = maskWindow(width, height, ox, oy, radius)
  const { x0, y0, w } = window
  const mask = new Uint8Array(w * window.h)
  const obsElev = ground + observerHeight

  const ray = (px, py) => {
    const dist = Math.sqrt(px * px + py * py)
    const steps = Math.round(dist)
    if (steps === 0) return
    const sx = px / steps
    const sy = py / steps
    const stepM = (dist / steps) * metersPerCell
    let maxSlope = -Infinity
    for (let i = 1; i <= steps; i++) {
      const cx = (ox + sx * i) | 0
      const cy = (oy + sy * i) | 0
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) return
      const g = data[cy * width + cx]
      if (g <= NO_DATA) continue // unknown cell: neither blocks nor shows
      const dm = i * stepM
      const corrected = g - dm * dm * CURVATURE
      const slope = (corrected - obsElev) / dm
      mask[(cy - y0) * w + (cx - x0)] =
        slope + targetHeight / dm >= maxSlope ? VISIBLE : HIDDEN
      if (slope > maxSlope) maxSlope = slope
    }
  }

  for (let k = -radius; k <= radius; k++) {
    ray(k, -radius)
    ray(k, radius)
    ray(-radius, k)
    ray(radius, k)
  }

  return { mask, ...window }
}

// ────────────────────────────────────────────────────────────
// WebGPU backend
// ────────────────────────────────────────────────────────────

const WGSL = /* wgsl */ `
struct Params {
  width: u32, height: u32, ox: i32, oy: i32,
  radius: i32, x0: i32, y0: i32, w: u32,
  obsElev: f32, metersPerCell: f32, curvature: f32, targetHeight: f32
}
@group(0) @binding(0) var<storage, read> dem : array<f32>;
@group(0) @binding(1) var<storage, read_write> mask : array<u32>;
@group(0) @binding(2) var<uniform> P : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let r = P.radius;
  let k = i32(gid.x);
  if (k >= 8 * r) { return; }

  // perimeter cell of the square ring, global index k in [0, 8r)
  let side = k / (2 * r);
  let t = (k % (2 * r)) - r;
  var px = 0; var py = 0;
  if (side == 0)      { px = t;  py = -r; }
  else if (side == 1) { px = t;  py = r; }
  else if (side == 2) { px = -r; py = t; }
  else                { px = r;  py = t; }

  let dist = sqrt(f32(px * px + py * py));
  let steps = i32(round(dist));
  if (steps == 0) { return; }
  let sx = f32(px) / f32(steps);
  let sy = f32(py) / f32(steps);
  let stepM = dist / f32(steps) * P.metersPerCell;
  let ox = f32(P.ox);
  let oy = f32(P.oy);
  var maxSlope = -1e30;

  for (var i = 1; i <= steps; i++) {
    let cx = i32(ox + sx * f32(i));
    let cy = i32(oy + sy * f32(i));
    if (cx < 0 || cy < 0 || cx >= i32(P.width) || cy >= i32(P.height)) { return; }
    let g = dem[u32(cy) * P.width + u32(cx)];
    if (g <= ${NO_DATA}.0) { continue; }
    let dm = f32(i) * stepM;
    let corrected = g - dm * dm * P.curvature;
    let slope = (corrected - P.obsElev) / dm;
    let idx = u32(cy - P.y0) * P.w + u32(cx - P.x0);
    if (slope + P.targetHeight / dm >= maxSlope) { mask[idx] = 1u; } else { mask[idx] = 2u; }
    if (slope > maxSlope) { maxSlope = slope; }
  }
}`

function WebGPUBackend (device) {
  this.device_ = device
  this.pipeline_ = device.createComputePipeline({
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: WGSL }), entryPoint: 'main' }
  })
  this.uniformBuffer_ = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  this.uniformData_ = new ArrayBuffer(48)
  this.grid_ = null
  this.demBuffer_ = null
  this.maskBuffer_ = null
  this.stagingBuffer_ = null
  this.maskSize_ = 0
}

WebGPUBackend.prototype.uploadGrid_ = function (grid) {
  if (this.grid_ === grid) return
  const device = this.device_
  if (this.demBuffer_) this.demBuffer_.destroy()
  this.demBuffer_ = device.createBuffer({
    size: grid.data.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(this.demBuffer_, 0, grid.data)
  this.grid_ = grid
  this.bindGroup_ = null
}

WebGPUBackend.prototype.ensureMaskBuffers_ = function (cells) {
  if (this.maskSize_ >= cells && this.maskBuffer_) return
  const device = this.device_
  if (this.maskBuffer_) this.maskBuffer_.destroy()
  if (this.stagingBuffer_) this.stagingBuffer_.destroy()
  this.maskBuffer_ = device.createBuffer({
    size: cells * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  })
  this.stagingBuffer_ = device.createBuffer({
    size: cells * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  })
  this.maskSize_ = cells
  this.bindGroup_ = null
}

WebGPUBackend.prototype.compute = async function (grid, params) {
  const { ox, oy, radius, metersPerCell, observerHeight, targetHeight } = params
  const { data, width, height } = grid
  if (ox < 0 || oy < 0 || ox >= width || oy >= height) return null
  const ground = data[oy * width + ox]
  if (ground <= NO_DATA) return null

  const window = maskWindow(width, height, ox, oy, radius)
  const cells = window.w * window.h

  this.uploadGrid_(grid)
  this.ensureMaskBuffers_(cells)
  if (!this.bindGroup_) {
    this.bindGroup_ = this.device_.createBindGroup({
      layout: this.pipeline_.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.demBuffer_ } },
        { binding: 1, resource: { buffer: this.maskBuffer_ } },
        { binding: 2, resource: { buffer: this.uniformBuffer_ } }
      ]
    })
  }

  const u32 = new Uint32Array(this.uniformData_, 0, 8)
  const i32 = new Int32Array(this.uniformData_, 0, 8)
  const f32 = new Float32Array(this.uniformData_, 32, 4)
  u32[0] = width; u32[1] = height
  i32[2] = ox; i32[3] = oy
  i32[4] = radius; i32[5] = window.x0; i32[6] = window.y0
  u32[7] = window.w
  f32[0] = ground + observerHeight
  f32[1] = metersPerCell
  f32[2] = CURVATURE
  f32[3] = targetHeight
  this.device_.queue.writeBuffer(this.uniformBuffer_, 0, this.uniformData_)

  const encoder = this.device_.createCommandEncoder()
  encoder.clearBuffer(this.maskBuffer_, 0, cells * 4)
  const pass = encoder.beginComputePass()
  pass.setPipeline(this.pipeline_)
  pass.setBindGroup(0, this.bindGroup_)
  pass.dispatchWorkgroups(Math.ceil(8 * radius / 64))
  pass.end()
  encoder.copyBufferToBuffer(this.maskBuffer_, 0, this.stagingBuffer_, 0, cells * 4)
  this.device_.queue.submit([encoder.finish()])

  await this.stagingBuffer_.mapAsync(GPUMapMode.READ, 0, cells * 4)
  const mask = new Uint32Array(this.stagingBuffer_.getMappedRange(0, cells * 4).slice(0))
  this.stagingBuffer_.unmap()

  return { mask, ...window }
}

// ────────────────────────────────────────────────────────────
// Engine facade
// ────────────────────────────────────────────────────────────

export function ViewshedEngine () {
  this.backend_ = null
  this.ready_ = null
  this.queue_ = Promise.resolve()
}

/**
 * @returns {Promise<'webgpu'|'cpu'>} resolved backend
 */
ViewshedEngine.prototype.init = function () {
  if (this.ready_) return this.ready_
  this.ready_ = (async () => {
    try {
      const adapter = navigator.gpu && await navigator.gpu.requestAdapter()
      if (adapter) {
        const device = await adapter.requestDevice()
        this.backend_ = new WebGPUBackend(device)
        return 'webgpu'
      }
    } catch (err) {
      console.warn('[ViewshedEngine] WebGPU unavailable, falling back to CPU:', err.message)
    }
    return 'cpu'
  })()
  return this.ready_
}

/**
 * Compute a viewshed mask. See viewshedCPU for parameters.
 * Calls are serialized: concurrent computes would otherwise destroy
 * GPU buffers that still have queued work (grid re-upload).
 * @returns {Promise<null | {mask: Uint8Array|Uint32Array, x0, y0, w, h}>}
 */
ViewshedEngine.prototype.compute = function (grid, params) {
  const run = this.queue_.then(async () => {
    await this.init()
    return this.backend_
      ? this.backend_.compute(grid, params)
      : viewshedCPU(grid, params)
  })
  this.queue_ = run.catch(() => {}) // keep the chain alive after errors
  return run
}
