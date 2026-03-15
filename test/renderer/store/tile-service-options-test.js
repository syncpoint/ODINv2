import assert from 'assert'

// Extract the terrain detection and tag building logic from tile-service.js
// so we can test it without needing a live store.

const isTerrain = service =>
  (service.terrain || []).length > 0 ||
  service.capabilities?.contentType === 'terrain/mapbox-rgb'

const buildTags = (service, tags) => [
  `SCOPE:${service.type}:NONE`,
  isTerrain(service) ? 'SYSTEM:TERRAIN::mdiTerrain' : null,
  ...((tags || []))
    .filter(Boolean)
    .map(label => `USER:${label}:NONE`),
  'PLUS'
].filter(Boolean).join(' ')

describe('Tile service options — terrain tag', function () {

  describe('isTerrain detection', function () {

    it('XYZ service with terrain contentType is terrain', function () {
      const service = {
        type: 'XYZ',
        capabilities: { contentType: 'terrain/mapbox-rgb' }
      }
      assert.ok(isTerrain(service))
    })

    it('XYZ service without terrain contentType is not terrain', function () {
      const service = {
        type: 'XYZ',
        capabilities: {}
      }
      assert.ok(!isTerrain(service))
    })

    it('XYZ service with no capabilities is not terrain', function () {
      const service = { type: 'XYZ' }
      assert.ok(!isTerrain(service))
    })

    it('TileJSON service with terrain contentType is terrain', function () {
      const service = {
        type: 'TileJSON',
        capabilities: { contentType: 'terrain/mapbox-rgb' }
      }
      assert.ok(isTerrain(service))
    })

    it('TileJSON service without terrain contentType is not terrain', function () {
      const service = {
        type: 'TileJSON',
        capabilities: { contentType: 'image/png' }
      }
      assert.ok(!isTerrain(service))
    })

    it('TileJSONDiscovery with terrain layers is terrain', function () {
      const service = {
        type: 'TileJSONDiscovery',
        terrain: ['layer-a', 'layer-b']
      }
      assert.ok(isTerrain(service))
    })

    it('TileJSONDiscovery with empty terrain array is not terrain', function () {
      const service = {
        type: 'TileJSONDiscovery',
        terrain: []
      }
      assert.ok(!isTerrain(service))
    })

    it('TileJSONDiscovery without terrain property is not terrain', function () {
      const service = { type: 'TileJSONDiscovery' }
      assert.ok(!isTerrain(service))
    })

    it('TileJSONDiscovery with terrain contentType is also terrain', function () {
      // Both indicators work regardless of service type
      const service = {
        type: 'TileJSONDiscovery',
        terrain: [],
        capabilities: { contentType: 'terrain/mapbox-rgb' }
      }
      assert.ok(isTerrain(service))
    })

    it('WMS service is never terrain (no mechanism)', function () {
      const service = { type: 'WMS', capabilities: {} }
      assert.ok(!isTerrain(service))
    })

    it('WMTS service is never terrain (no mechanism)', function () {
      const service = { type: 'WMTS', capabilities: {} }
      assert.ok(!isTerrain(service))
    })
  })

  describe('tag string building', function () {

    it('terrain service gets SYSTEM:TERRAIN tag', function () {
      const service = {
        type: 'XYZ',
        capabilities: { contentType: 'terrain/mapbox-rgb' }
      }
      const tags = buildTags(service, [])
      assert.ok(tags.includes('SYSTEM:TERRAIN::mdiTerrain'))
      assert.ok(!tags.includes('USER:TERRAIN'))
    })

    it('non-terrain service does not get SYSTEM:TERRAIN tag', function () {
      const service = { type: 'XYZ', capabilities: {} }
      const tags = buildTags(service, [])
      assert.ok(!tags.includes('TERRAIN'))
    })

    it('user tags are rendered as USER: prefixed', function () {
      const service = { type: 'XYZ', capabilities: {} }
      const tags = buildTags(service, ['Basemap', 'Austria'])
      assert.ok(tags.includes('USER:Basemap:NONE'))
      assert.ok(tags.includes('USER:Austria:NONE'))
    })

    it('terrain tag and user tags coexist correctly', function () {
      const service = {
        type: 'TileJSONDiscovery',
        terrain: ['dem-layer']
      }
      const tags = buildTags(service, ['Elevation', 'Global'])
      assert.ok(tags.includes('SYSTEM:TERRAIN::mdiTerrain'))
      assert.ok(tags.includes('USER:Elevation:NONE'))
      assert.ok(tags.includes('USER:Global:NONE'))
    })

    it('always starts with SCOPE and ends with PLUS', function () {
      const service = { type: 'XYZ', capabilities: {} }
      const tags = buildTags(service, [])
      assert.ok(tags.startsWith('SCOPE:XYZ:NONE'))
      assert.ok(tags.endsWith('PLUS'))
    })

    it('null/undefined tags are filtered out', function () {
      const service = { type: 'XYZ', capabilities: {} }
      const tags = buildTags(service, [null, undefined, 'Valid', ''])
      assert.ok(tags.includes('USER:Valid:NONE'))
      assert.ok(!tags.includes('USER:null'))
      assert.ok(!tags.includes('USER:undefined'))
    })
  })
})
