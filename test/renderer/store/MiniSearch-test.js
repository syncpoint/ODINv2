import assert from 'assert'
import { createIndex, parseQuery, searchIndex } from '../../../src/renderer/store/minisearch-index'
import { documents } from '../../../src/renderer/store/documents'
import layer from './layer.json'
import fixture from './fixture.json'

const features = layer.map(feature => ({
  id: feature.id,
  text: feature.name || feature.properties.t,
  ...feature
}))

const fixtureReverse = Object.keys(fixture)
  .reduce((acc, key) => {
    acc[fixture[key]] = key
    return acc
  }, {})


const index = (() => {
  const index = createIndex()
  const cache = () => ({ /* layer */ })
  const docs = features.map(entry => documents.feature(entry, cache))
  index.addAll(docs)
  return index
})()


const verify = (query, expected) => () => {
  const tokens = parseQuery(query)
  const actual = searchIndex(index, tokens)
    .map(id => fixtureReverse[id])
    .sort()
    .join('')

  assert.deepStrictEqual(actual, expected)
}

describe('MiniSearch', function () {
  it(" 1. - '1'", verify('1', 'ABCHJ'))
  it(" 2. - '1.'", verify('1.', 'A'))
  it(" 3. - '1/'", verify('1/', 'BCHJ'))
  it(" 4. - 'Inf'", verify('Inf', 'ABCDEFG'))
  it(" 5. - 'InfBn'", verify('InfBn', 'ABD'))
  it(" 6. - '53'", verify('53', 'ABCDGHIJP'))
  it(" 7. - '/53'", verify('/53', 'CHIJ'))
  it(" 8. - 'JgB'", verify('JgB', 'GP'))
  it(" 9. - '88'", verify('88', 'IKO'))
  it("10. - 'CP III'", verify('CP III', 'K'))
  it("11. - 'Check'", verify('Check', 'KL'))
  it("12. - 'PL'", verify('PL', 'MN'))
  it("13. - 'zu'", verify('zu', 'HI'))
  it("14. - '\"'", verify('"', 'MN'))
  it("15. - 'Boun'", verify('Boun', 'HIJ'))
  it("16. - 'Unit'", verify('Unit', 'ABCDEFG'))
  it("17. - '#Control'", verify('#Control', 'HIJKLMNOP'))
  it("18. - '#Eny'", verify('#Eny', 'JKO'))
  it("19. - '#ukn'", verify('#ukn', 'L'))
})
