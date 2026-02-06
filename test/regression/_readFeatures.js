const { readFileSync } = require('fs')
const pathname = require('./_pathname')

/**
 * Read features.
 */
const readFeatures = p => {
  const content = readFileSync(pathname('./layer.json'), 'utf8')
  const { features } = JSON.parse(content)
  return features.filter(p)
}

module.exports = readFeatures
