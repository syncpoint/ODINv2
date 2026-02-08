const path = require('path')

const findArg = (prefix) => {
  const entry = process.argv.find(s => s.startsWith(prefix))
  if (entry) return entry.split('=')[1]
  return undefined
}

module.exports = {
  page: findArg('--page='),
  databases: findArg('--databases='),
  isMac: process.platform === 'darwin',
  isDevelopment: process.env.NODE_ENV === 'development',
  nominatimUrl: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
  pathJoin: (...args) => path.join(...args),
  pathExtname: (p) => path.extname(p),
  pathBasename: (p, ext) => path.basename(p, ext)
}
