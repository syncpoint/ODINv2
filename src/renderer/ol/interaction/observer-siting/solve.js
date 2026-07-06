/**
 * Multiple observer siting: find a small set of observer positions
 * inside an area whose combined viewsheds maximize coverage of that
 * area (set cover over viewsheds — NP-hard; solved with the standard
 * greedy max-coverage heuristic, (1 - 1/e) approximation).
 *
 * All functions are pure and operate in grid-cell space so they are
 * unit-testable without OpenLayers or a GPU.
 */

/**
 * Rasterize polygon rings onto a grid using even-odd scanline filling.
 * Rings are arrays of [x, y] in grid-cell coordinates (fractional
 * allowed; cell centers at integer + 0.5 are tested). Holes work via
 * the even-odd rule.
 *
 * @param {Array<Array<[number, number]>>} rings - outer ring (+ holes)
 * @param {number} width - grid width [cells]
 * @param {number} height - grid height [cells]
 * @returns {{ mask: Uint8Array, cells: number }} 1 = inside
 */
export const rasterizePolygon = (rings, width, height) => {
  const mask = new Uint8Array(width * height)
  let cells = 0

  for (let row = 0; row < height; row++) {
    const y = row + 0.5
    const intersections = []
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i]
        const [x2, y2] = ring[(i + 1) % ring.length]
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          intersections.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
        }
      }
    }
    intersections.sort((a, b) => a - b)
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const from = Math.max(0, Math.ceil(intersections[i] - 0.5))
      const to = Math.min(width - 1, Math.floor(intersections[i + 1] - 0.5))
      for (let col = from; col <= to; col++) {
        mask[row * width + col] = 1
        cells++
      }
    }
  }

  return { mask, cells }
}

/**
 * Candidate observer cells via block max-pooling: the grid is divided
 * into square blocks and each block contributes its highest in-area
 * cell. This spreads candidates uniformly over the whole area — flat
 * parts get their share of candidates instead of being crowded out by
 * higher terrain elsewhere — while hilly blocks still contribute their
 * local summit. The block size grows until the candidate count fits
 * the budget.
 *
 * @param {{data: Float32Array, width: number, height: number}} grid
 * @param {Uint8Array} inArea - rasterized polygon mask (grid-sized)
 * @param {object} options - minSpacing [cells] (initial block size),
 *   maxCandidates
 * @returns {Array<{x: number, y: number, elevation: number}>} sorted
 *   by elevation, highest first
 */
export const findCandidates = (grid, inArea, { minSpacing, maxCandidates }) => {
  const { data, width, height } = grid

  const collect = size => {
    const candidates = []
    for (let by = 0; by < height; by += size) {
      for (let bx = 0; bx < width; bx += size) {
        let best = null
        const yMax = Math.min(height, by + size)
        const xMax = Math.min(width, bx + size)
        for (let y = by; y < yMax; y++) {
          for (let x = bx; x < xMax; x++) {
            const idx = y * width + x
            if (!inArea[idx]) continue
            const v = data[idx]
            if (!Number.isFinite(v)) continue
            if (!best || v > best.elevation) best = { x, y, elevation: v }
          }
        }
        if (best) candidates.push(best)
      }
    }
    return candidates
  }

  let size = Math.max(2, Math.round(minSpacing))
  let candidates = collect(size)
  while (candidates.length > maxCandidates) {
    size = Math.ceil(size * Math.sqrt(candidates.length / maxCandidates))
    candidates = collect(size)
  }

  return candidates.sort((a, b) => b.elevation - a.elevation)
}

/**
 * Greedy max-coverage over candidate viewsheds.
 *
 * @param {object} options
 * @param {number} options.areaCells - number of cells inside the area
 * @param {Array<{candidate: object, covers: Uint8Array}>} options.viewsheds -
 *   per candidate: grid-sized 0/1 array of area cells visible from it
 * @param {number} options.targetCoverage - stop at this fraction [0..1]
 * @param {number} options.maxObservers
 * @param {number} options.minGain - stop when the best remaining
 *   candidate adds less than this fraction of the area
 * @returns {{ picks: Array<{candidate, gain: number}>, covered: number, coverage: number }}
 */
export const greedySiting = ({ areaCells, viewsheds, targetCoverage, maxObservers, minGain }) => {
  if (!viewsheds.length || !areaCells) return { picks: [], covered: 0, coverage: 0 }

  const size = viewsheds[0].covers.length
  const uncovered = new Uint8Array(size)
  viewsheds.forEach(({ covers }) => {
    for (let i = 0; i < size; i++) if (covers[i]) uncovered[i] = 1
  })
  // uncovered now marks every cell at least one candidate could see;
  // cells nobody can see are excluded from the gain computation but
  // coverage is still reported against the full area.

  const remaining = [...viewsheds]
  const picks = []
  let covered = 0

  while (picks.length < maxObservers && remaining.length) {
    let best = -1
    let bestGain = 0
    for (let c = 0; c < remaining.length; c++) {
      const { covers } = remaining[c]
      let gain = 0
      for (let i = 0; i < size; i++) if (covers[i] && uncovered[i]) gain++
      if (gain > bestGain) { bestGain = gain; best = c }
    }

    if (best < 0 || bestGain < minGain * areaCells) break

    const [pick] = remaining.splice(best, 1)
    for (let i = 0; i < size; i++) {
      if (pick.covers[i] && uncovered[i]) { uncovered[i] = 0; covered++ }
    }
    picks.push({ candidate: pick.candidate, gain: bestGain })

    if (covered / areaCells >= targetCoverage) break
  }

  return { picks, covered, coverage: covered / areaCells }
}
