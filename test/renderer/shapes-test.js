import assert from 'assert'
import { className } from '../../src/renderer/symbology/2525c.js'

describe('Shapes - className', function () {

  it('should return SHAPE for LineString feature without SIDC', function () {
    const feature = {
      geometry: { type: 'LineString', coordinates: [[16.37, 48.21], [16.38, 48.22]] },
      properties: {}
    }
    assert.equal(className(undefined, feature), 'SHAPE')
    assert.equal(className(null, feature), 'SHAPE')
  })

  it('should return SHAPE for Polygon feature without SIDC', function () {
    const feature = {
      geometry: { type: 'Polygon', coordinates: [[[16.35, 48.20], [16.37, 48.20], [16.37, 48.22], [16.35, 48.20]]] },
      properties: {}
    }
    assert.equal(className(null, feature), 'SHAPE')
  })

  it('should return undefined for Point feature without SIDC', function () {
    const feature = {
      geometry: { type: 'Point', coordinates: [16.37, 48.21] },
      properties: {}
    }
    assert.equal(className(null, feature), undefined)
  })

  it('should return undefined when no SIDC and no feature', function () {
    assert.equal(className(null), undefined)
    assert.equal(className(undefined), undefined)
    assert.equal(className(null, null), undefined)
  })

  it('should return normal className for features WITH SIDC', function () {
    // Unit: SFGPUC (friendly unit)
    const result = className('SFGPUC----------')
    assert.ok(result, 'should return a className for valid SIDC')
    assert.notEqual(result, 'SHAPE')
  })

  it('should return undefined for invalid SIDC', function () {
    const result = className('XXXXXXXXXXXXXXXX')
    assert.equal(result, undefined)
  })
})
