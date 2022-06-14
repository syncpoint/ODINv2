import assert from 'assert'
import { createIndex, parseQuery } from './MiniSearch'
import { documents } from './documents'
import layer from './data/layer.json'
import fixture from './data/fixture.json'
import _3OSC from './data/3OSC.json'

describe('MiniSearch', function () {
  describe('default', function () {

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
      const cache = id => {
        const scope = id.split(':')[0]
        switch (scope) {
          case 'layer': return {}
          case 'hidden+feature': return false
          case 'locked+feature': return false
          case 'tags+feature': return []
        }
      }

      const entries = features.map(({ id, ...value }) => [id, value])
      const docs = entries.map(([key, value]) => documents.feature(key, value, cache))
      console.log(docs)
      index.addAll(docs)
      return index
    })()


    const verify = (terms, expected) => () => {
      const [query] = parseQuery(terms)
      const actual = index.search(query)
        .map(({ id }) => fixtureReverse[id])
        .sort()
        .join('')

      assert.deepStrictEqual(actual, expected)
    }

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

  const prepareIndex = docs => {
    const index = createIndex()
    index.addAll(docs)
    return index
  }

  describe('issues', function () {
    it("MIP Scenario - '@feature #unit 3osc'", function () {
      const index = prepareIndex(_3OSC)
      const [query] = parseQuery('@feature #unit 3osc')
      const actual = index.search(query)
      assert.strictEqual(actual.length, _3OSC.length - 1) // minus one installation
    })
  })
})
