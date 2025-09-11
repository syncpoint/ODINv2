import assert from 'assert'
import Fuse from 'fuse.js'

const options = {
  includeScore: false,
  shouldSort: false,
  ignoreLocation: true,
  threshold: 0.0,
  keys: ['title']
}

describe('fuse.js (regression', function () {
  it('search :: String -> Entry[]', function () {
    const entries = ['bear', 'bearing', 'banana', 'boat'].map(title => ({ title }))
    const fuse = new Fuse(entries, options)

    const expected = [
      { item: { title: 'bear' }, refIndex: 0 },
      { item: { title: 'bearing' }, refIndex: 1 }
    ]

    const actual = fuse.search('bear')
    assert.deepStrictEqual(actual, expected)
  })
})