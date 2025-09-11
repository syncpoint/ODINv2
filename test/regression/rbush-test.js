const assert = require('assert')
const { resolve } = require('path')
const { readFileSync } = require('fs')
const RBush = require('rbush').default

const pathname = dir => resolve(__dirname, dir)

/**
 * Read point features.
 */
const readFeatures = () => {
  const content = readFileSync(pathname('./layer.json'), 'utf8')
  const { features } = JSON.parse(content)
  return features.filter(({ geometry }) => geometry.type === 'Point')
}

const entry = feature => ({
  id: feature.id,
  minX: feature.geometry.coordinates[0],
  minY: feature.geometry.coordinates[1],
  maxX: feature.geometry.coordinates[0],
  maxY: feature.geometry.coordinates[1]
})

const load = features => {
  const entries = features.map(entry)
  const rbush = new RBush()
  rbush.load(entries)
  return rbush
}

describe('rbush (regression)', function () {
  it('all :: () -> Entry[]', function () {
    const features = readFeatures()
    const rbush = load(features)
    assert.strictEqual(11, rbush.all().length)
  })

  it('search :: Extent -> Entry[]', function () {
    const rbush = load(readFeatures())
    const data = rbush.data
    const [dx, dy] = [data.maxX - data.minX, data.maxY - data.minY]

    const expected = [
      'feature:d130ea97-11b3-4f03-aed2-364c7ece1bf1/bd8fe4df-8477-446b-895d-33375086df5c',
      'feature:d130ea97-11b3-4f03-aed2-364c7ece1bf1/8eef70db-4a06-4720-a5dd-9d62ea36447c',
      'feature:d130ea97-11b3-4f03-aed2-364c7ece1bf1/284a2cef-5e4e-4a7a-b331-50786a167be1'
    ]

    const matches = rbush.search({
      minX: data.minX + dx / 4,
      minY: data.minY + dy / 4,
      maxX: data.maxX - dx / 4,
      maxY: data.maxY - dy / 4
    })

    const actual = matches.map(({ id }) => id)
    assert.deepStrictEqual(actual, expected)
  })

  it('remove :: Entry -> Unit', function () {
    const rbush = load(readFeatures())
    const entry =  rbush.all()[0]
    rbush.remove(entry)
    assert.strictEqual(10, rbush.all().length)
  })

  it('insert :: Entry -> Unit', function () {
    const [head, ...tail] = readFeatures()
    const rbush = load(tail)
    rbush.insert(head)
    assert.strictEqual(11, rbush.all().length)
  })
})