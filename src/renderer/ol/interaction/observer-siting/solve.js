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
 * Candidate observer cells: local terrain maxima inside the area,
 * thinned by non-maximum suppression so candidates keep a minimum
 * spacing. Falls back to a regular lattice when the terrain yields
 * too few maxima (flat areas).
 *
 * @param {{data: Float32Array, width: number, height: number}} grid
 * @param {Uint8Array} inArea - rasterized polygon mask (grid-sized)
 * @param {object} options - minSpacing [cells], maxCandidates
 * @returns {Array<{x: number, y: number, elevation: number}>}
 */
export const findCandidates = (grid, inArea, { minSpacing, maxCandidates }) => {
  const { data, width, height } = grid

  const peaks = []
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (!inArea[idx]) continue
      const v = data[idx]
      if (!Number.isFinite(v)) continue
      if (
        v >= data[idx - 1] && v >= data[idx + 1] &&
        v >= data[idx - width] && v >= data[idx + width] &&
        v >= data[idx - width - 1] && v >= data[idx - width + 1] &&
        v >= data[idx + width - 1] && v >= data[idx + width + 1]
      ) peaks.push({ x, y, elevation: v })
    }
  }
  peaks.sort((a, b) => b.elevation - a.elevation)

  // non-maximum suppression: keep highest, drop peaks closer than minSpacing
  const spacing2 = minSpacing * minSpacing
  const selected = []
  for (const peak of peaks) {
    if (selected.length >= maxCandidates) break
    const tooClose = selected.some(s => {
      const dx = s.x - peak.x
      const dy = s.y - peak.y
      return dx * dx + dy * dy < spacing2
    })
    if (!tooClose) selected.push(peak)
  }

  // lattice fallback for flat terrain: sample area cells on a grid
  if (selected.length < Math.min(8, maxCandidates)) {
    const step = Math.max(1, Math.round(minSpacing))
    for (let y = Math.floor(step / 2); y < height && selected.length < maxCandidates; y += step) {
      for (let x = Math.floor(step / 2); x < width && selected.length < maxCandidates; x += step) {
        const idx = y * width + x
        if (!inArea[idx] || !Number.isFinite(data[idx])) continue
        const tooClose = selected.some(s => {
          const dx = s.x - x
          const dy = s.y - y
          return dx * dx + dy * dy < spacing2
        })
        if (!tooClose) selected.push({ x, y, elevation: data[idx] })
      }
    }
  }

  return selected
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
