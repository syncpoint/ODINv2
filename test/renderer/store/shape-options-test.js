import assert from 'assert'

// We can't easily test the full feature options function (it needs a store),
// but we can test the shape detection logic extracted from it.

const isShape = feature => {
  const properties = feature?.properties || {}
  if (properties.sidc) return false
  const geomType = feature?.geometry?.type
  return geomType === 'LineString' || geomType === 'Polygon'
}

const shapeGeometryLabel = feature => {
  const geomType = feature?.geometry?.type
  if (geomType === 'LineString') return 'Line'
  if (geomType === 'Polygon') return 'Polygon'
  return 'Shape'
}

describe('Shape detection', function () {

  it('should identify LineString without SIDC as shape', function () {
    const feature = {
      geometry: { type: 'LineString', coordinates: [] },
      properties: {}
    }
    assert.ok(isShape(feature))
    assert.equal(shapeGeometryLabel(feature), 'Line')
  })

  it('should identify Polygon without SIDC as shape', function () {
    const feature = {
      geometry: { type: 'Polygon', coordinates: [] },
      properties: {}
    }
    assert.ok(isShape(feature))
    assert.equal(shapeGeometryLabel(feature), 'Polygon')
  })

  it('should NOT identify LineString WITH SIDC as shape', function () {
    const feature = {
      geometry: { type: 'LineString', coordinates: [] },
      properties: { sidc: 'GFGPGLF-------X' }
    }
    assert.ok(!isShape(feature))
  })

  it('should NOT identify Point without SIDC as shape', function () {
    const feature = {
      geometry: { type: 'Point', coordinates: [] },
      properties: {}
    }
    assert.ok(!isShape(feature))
  })

  it('should handle null/undefined gracefully', function () {
    assert.ok(!isShape(null))
    assert.ok(!isShape(undefined))
    assert.ok(!isShape({}))
    assert.ok(!isShape({ geometry: null }))
  })
})
