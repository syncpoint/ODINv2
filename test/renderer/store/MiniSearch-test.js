import assert from 'assert'
import { createIndex } from '../../../src/renderer/store/minisearch-index'
import { documents } from '../../../src/renderer/store/documents'
import layer from './layer.json'

const features = layer.map(feature => ({
  id: feature.id,
  text: feature.name || feature.properties.t,
  ...feature
}))

const fixture = {
  A: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/2e768802-d8c6-41d3-82be-22483fe6bfaa',
  B: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/9a8f30bd-b5a2-4f83-9196-2e71cbb691e5',
  C: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/c564ac17-1ef9-42e0-89f9-89006451ba0c',
  D: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/d700d104-14bf-4a66-9436-807c286fef34',
  E: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/1748fb31-07ce-45d3-8396-7ec8554f50ff',
  F: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/f6a40f8b-7a2d-4ad7-82e6-6cc9b63409d0',
  G: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/2bdeef8a-6b63-4eb0-a02d-7f34bd0aae49',
  H: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/c442c732-8cf7-4444-b4a9-27bb15e41fc6',
  I: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/d510850f-8747-4c71-9147-d6f03607e5fe',
  J: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/8fe648dd-c9d6-4963-85e8-ff5f085953b7',
  K: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/21fc859e-8b6a-4823-9cbb-3a2e185fb6d6',
  L: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/5b3f8da2-2e5e-4580-bc7e-cfd7ab795030',
  M: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/25a03bdb-854f-409f-b4a6-192c58f9946c',
  N: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/3ec4ec3e-5347-408e-b413-51ee8531b11f',
  O: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/0b049638-d31d-42fd-a70a-8241f7e73e30',
  P: 'feature:78e6ba85-3c39-4d16-a6f5-2b187330597f/27bebd04-3ecd-4503-9a5d-dee1e39b39f2'
}

const fixtureReverse = Object.keys(fixture)
  .reduce((acc, key) => {
    acc[fixture[key]] = key
    return acc
  }, {})


const index = createIndex()

const cache = () => ({ /* layer */ })
const docs = features.map(entry => documents.feature(entry, cache))
index.addAll(docs)

const search = query => {
  const matches = index.search(query, { fields: ['text'], prefix: true, combineWith: 'AND' })
  return matches.map(match => fixtureReverse[match.id]).sort()
}

const verify = (query, expected) => () => {
  const actual = search(query)
  assert.deepStrictEqual(actual, expected)
}

describe.only('MiniSearch', function () {
  it(" 1. - '1'", verify('1', ['A', 'B', 'C', 'H', 'J']))
  it(" 2. - '1.'", verify('1.', ['A']))
  it(" 3. - '1/'", verify('1/', ['B', 'C', 'H', 'J']))
  it(" 4. - 'Inf'", verify('Inf', ['A', 'B', 'C', 'D', 'E', 'F', 'G']))
  it(" 5. - 'InfBn'", verify('InfBn', ['A', 'B', 'D']))
  it(" 6. - '53'", verify('53', ['A', 'B', 'C', 'D', 'G', 'H', 'I', 'J', 'P']))
  it(" 7. - '/53'", verify('/53', ['C', 'H', 'I', 'J']))
  it(" 8. - 'JgB'", verify('JgB', ['G', 'P']))
  it(" 9. - '88'", verify('88', ['I', 'K', 'O']))
  it("10. - 'CP III'", verify('CP III', ['K']))
  it("11. - 'Check'", verify('Check', ['K', 'L']))
  it("12. - 'PL'", verify('PL', ['M', 'N']))
  it("13. - 'zu'", verify('zu', ['H', 'I']))
  it("14. - '\"'", verify('"', ['M', 'N']))
  it("15. - 'Boun'", verify('Boun', ['H', 'I', 'J']))
  it("16. - 'Unit'", verify('Unit', ['A', 'B', 'C', 'D', 'E', 'F', 'G']))
})
