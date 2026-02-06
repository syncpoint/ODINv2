import React from 'react'
import PropTypes from 'prop-types'

const PADDING = { top: 10, right: 16, bottom: 32, left: 56 }
const GRID_COLOR = 'rgba(0,0,0,0.08)'
const LINE_COLOR = 'rgba(255, 120, 0, 0.9)'
const FILL_COLOR = 'rgba(255, 120, 0, 0.15)'
const SEGMENT_COLOR = 'rgba(0,0,0,0.25)'
const CROSSHAIR_COLOR = 'rgba(0,0,0,0.4)'
const TEXT_COLOR = 'rgba(0,0,0,0.6)'
const FONT = '11px -apple-system, BlinkMacSystemFont, sans-serif'

const formatDistance = meters => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

const formatElevation = meters => `${Math.round(meters)} m`

/**
 * Compute nice axis tick values.
 */
const niceScale = (min, max, maxTicks = 6) => {
  const range = max - min || 1
  const roughStep = range / maxTicks
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const normalized = roughStep / mag

  let step
  if (normalized <= 1) step = mag
  else if (normalized <= 2) step = 2 * mag
  else if (normalized <= 5) step = 5 * mag
  else step = 10 * mag

  const start = Math.floor(min / step) * step
  const ticks = []
  for (let v = start; v <= max + step * 0.001; v += step) {
    ticks.push(v)
  }
  return ticks
}

export const ElevationChart = ({ data, segmentDistances, onHover }) => {
  const containerRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const [hoverIndex, setHoverIndex] = React.useState(null)

  // Observe container resize
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Draw the chart
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length === 0 || size.width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size.width, size.height)

    const chartW = size.width - PADDING.left - PADDING.right
    const chartH = size.height - PADDING.top - PADDING.bottom
    if (chartW <= 0 || chartH <= 0) return

    // Data ranges
    const elevations = data.map(d => d.elevation).filter(e => e != null)
    if (elevations.length === 0) return

    const minElev = Math.min(...elevations)
    const maxElev = Math.max(...elevations)
    const maxDist = data[data.length - 1].distance

    // Add some padding to elevation range
    const elevRange = maxElev - minElev || 1
    const elevMin = minElev - elevRange * 0.05
    const elevMax = maxElev + elevRange * 0.05

    const xScale = d => PADDING.left + (d / maxDist) * chartW
    const yScale = e => PADDING.top + chartH - ((e - elevMin) / (elevMax - elevMin)) * chartH

    // Grid lines + Y axis labels
    ctx.font = FONT
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const yTicks = niceScale(minElev, maxElev, 5)
    for (const tick of yTicks) {
      if (tick < elevMin || tick > elevMax) continue
      const y = yScale(tick)
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PADDING.left, y)
      ctx.lineTo(PADDING.left + chartW, y)
      ctx.stroke()

      ctx.fillStyle = TEXT_COLOR
      ctx.fillText(formatElevation(tick), PADDING.left - 6, y)
    }

    // X axis labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const xTicks = niceScale(0, maxDist, Math.min(8, Math.floor(chartW / 80)))
    for (const tick of xTicks) {
      if (tick < 0 || tick > maxDist) continue
      const x = xScale(tick)
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, PADDING.top)
      ctx.lineTo(x, PADDING.top + chartH)
      ctx.stroke()

      ctx.fillStyle = TEXT_COLOR
      ctx.fillText(formatDistance(tick), x, PADDING.top + chartH + 4)
    }

    // Chart area border
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(PADDING.left, PADDING.top, chartW, chartH)

    // Segment boundary markers
    if (segmentDistances && segmentDistances.length > 0) {
      ctx.strokeStyle = SEGMENT_COLOR
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      for (const dist of segmentDistances) {
        const x = xScale(dist)
        ctx.beginPath()
        ctx.moveTo(x, PADDING.top)
        ctx.lineTo(x, PADDING.top + chartH)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    // Build path from valid data points
    const points = data
      .filter(d => d.elevation != null)
      .map(d => [xScale(d.distance), yScale(d.elevation)])

    if (points.length < 2) return

    // Filled area
    ctx.beginPath()
    ctx.moveTo(points[0][0], PADDING.top + chartH)
    for (const [x, y] of points) ctx.lineTo(x, y)
    ctx.lineTo(points[points.length - 1][0], PADDING.top + chartH)
    ctx.closePath()
    ctx.fillStyle = FILL_COLOR
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1])
    }
    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw crosshair if hovering
    if (hoverIndex != null && hoverIndex >= 0 && hoverIndex < data.length && data[hoverIndex].elevation != null) {
      const hx = xScale(data[hoverIndex].distance)
      const hy = yScale(data[hoverIndex].elevation)

      ctx.strokeStyle = CROSSHAIR_COLOR
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(hx, PADDING.top)
      ctx.lineTo(hx, PADDING.top + chartH)
      ctx.stroke()
      ctx.setLineDash([])

      // Hover dot
      ctx.beginPath()
      ctx.arc(hx, hy, 4, 0, Math.PI * 2)
      ctx.fillStyle = LINE_COLOR
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Tooltip
      const label = `${formatElevation(data[hoverIndex].elevation)}  |  ${formatDistance(data[hoverIndex].distance)}`
      ctx.font = FONT
      const metrics = ctx.measureText(label)
      const tw = metrics.width + 12
      const th = 20
      let tx = hx + 10
      if (tx + tw > PADDING.left + chartW) tx = hx - tw - 10
      const ty = Math.max(PADDING.top, hy - th - 6)

      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.beginPath()
      ctx.roundRect(tx, ty, tw, th, 4)
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, tx + 6, ty + th / 2)
    }
  }, [data, segmentDistances, size, hoverIndex])

  // Mouse move handler
  const handleMouseMove = React.useCallback((e) => {
    if (!data || data.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const chartW = size.width - PADDING.left - PADDING.right
    const maxDist = data[data.length - 1].distance

    const fraction = (mx - PADDING.left) / chartW
    if (fraction < 0 || fraction > 1) {
      setHoverIndex(null)
      onHover?.(null)
      return
    }

    const dist = fraction * maxDist
    // Find closest data point
    let closest = 0
    let closestDelta = Infinity
    for (let i = 0; i < data.length; i++) {
      const delta = Math.abs(data[i].distance - dist)
      if (delta < closestDelta) {
        closestDelta = delta
        closest = i
      }
    }

    setHoverIndex(closest)
    onHover?.(closest)
  }, [data, size, onHover])

  const handleMouseLeave = React.useCallback(() => {
    setHoverIndex(null)
    onHover?.(null)
  }, [onHover])

  return (
    <div ref={containerRef} className='elevation-chart'>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}

ElevationChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    distance: PropTypes.number.isRequired,
    elevation: PropTypes.number,
    coordinate: PropTypes.array
  })).isRequired,
  segmentDistances: PropTypes.arrayOf(PropTypes.number),
  onHover: PropTypes.func
}
