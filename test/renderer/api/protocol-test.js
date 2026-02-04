import assert from 'assert'
import {
  isValidKey,
  isFeatureKey,
  isTagsKey,
  hasValidGeometry,
  deduplicateTags
} from '../../../src/renderer/api/protocol'


describe('API Protocol', function () {

  describe('isValidKey', function () {
    it('accepts valid layer key', function () {
      assert.strictEqual(isValidKey('layer:abc-123'), true)
    })

    it('accepts valid feature key', function () {
      assert.strictEqual(isValidKey('feature:layer-uuid/feature-uuid'), true)
    })

    it('accepts valid tags key', function () {
      assert.strictEqual(isValidKey('tags+layer:abc-123'), true)
    })

    it('rejects invalid prefix', function () {
      assert.strictEqual(isValidKey('invalid:abc-123'), false)
    })

    it('rejects empty string', function () {
      assert.strictEqual(isValidKey(''), false)
    })

    it('rejects non-string', function () {
      assert.strictEqual(isValidKey(123), false)
      assert.strictEqual(isValidKey(null), false)
      assert.strictEqual(isValidKey(undefined), false)
    })
  })

  describe('isFeatureKey', function () {
    it('returns true for feature keys', function () {
      assert.strictEqual(isFeatureKey('feature:layer-uuid/feature-uuid'), true)
    })

    it('returns true for marker keys', function () {
      assert.strictEqual(isFeatureKey('marker:abc-123'), true)
    })

    it('returns false for layer keys', function () {
      assert.strictEqual(isFeatureKey('layer:abc-123'), false)
    })

    it('returns false for tags keys', function () {
      assert.strictEqual(isFeatureKey('tags+layer:abc-123'), false)
    })
  })

  describe('isTagsKey', function () {
    it('returns true for tags keys', function () {
      assert.strictEqual(isTagsKey('tags+layer:abc-123'), true)
      assert.strictEqual(isTagsKey('tags+feature:layer/feature'), true)
    })

    it('returns false for non-tags keys', function () {
      assert.strictEqual(isTagsKey('layer:abc-123'), false)
      assert.strictEqual(isTagsKey('feature:abc/def'), false)
    })

    it('returns false for non-string', function () {
      assert.strictEqual(isTagsKey(null), false)
      assert.strictEqual(isTagsKey(undefined), false)
      assert.strictEqual(isTagsKey(123), false)
    })
  })

  describe('hasValidGeometry', function () {
    it('returns true for valid geometry', function () {
      assert.strictEqual(hasValidGeometry({ geometry: { type: 'Point' } }), true)
    })

    it('returns false for missing geometry', function () {
      assert.strictEqual(hasValidGeometry({}), false)
      assert.strictEqual(hasValidGeometry({ name: 'test' }), false)
    })

    it('returns false for geometry without type', function () {
      assert.strictEqual(hasValidGeometry({ geometry: {} }), false)
      assert.strictEqual(hasValidGeometry({ geometry: { coordinates: [0, 0] } }), false)
    })
  })

  describe('deduplicateTags', function () {
    it('removes case-insensitive duplicates', function () {
      const result = deduplicateTags(['HQ', 'COMMAND', 'hq'])
      assert.deepStrictEqual(result, ['HQ', 'COMMAND'])
    })

    it('keeps first occurrence (preserves original casing)', function () {
      const result = deduplicateTags(['thx', 'ThX', 'tHx', 'THX'])
      assert.deepStrictEqual(result, ['thx'])
    })

    it('handles mixed case variations', function () {
      const result = deduplicateTags(['Alpha', 'BRAVO', 'alpha', 'bravo', 'Charlie'])
      assert.deepStrictEqual(result, ['Alpha', 'BRAVO', 'Charlie'])
    })

    it('returns empty array for empty input', function () {
      const result = deduplicateTags([])
      assert.deepStrictEqual(result, [])
    })

    it('returns single tag unchanged', function () {
      const result = deduplicateTags(['SINGLE'])
      assert.deepStrictEqual(result, ['SINGLE'])
    })

    it('handles non-array input gracefully', function () {
      assert.strictEqual(deduplicateTags(null), null)
      assert.strictEqual(deduplicateTags(undefined), undefined)
      assert.strictEqual(deduplicateTags('string'), 'string')
    })

    it('preserves order of first occurrences', function () {
      const result = deduplicateTags(['C', 'b', 'A', 'B', 'a', 'c'])
      assert.deepStrictEqual(result, ['C', 'b', 'A'])
    })
  })
})
