import path from 'path'
import fs from 'fs'
import level from 'level'
import { evented, EVENT } from './evented'

let db

const quit = () => db.close()


/**
 *
 */
const open = directory => {
  const databases = path.join(directory, 'databases')
  const master = path.join(databases, 'master')
  fs.mkdirSync(databases, { recursive: true })
  db = level(master, { valueEncoding: 'json' })
  evented.on(EVENT.QUIT, quit)
}


export default {
  open,

  /**
   * Expose database interface directly instead of
   * duplicating its rather simple API.
   *
   * At some point we probably might regret this.
   * But until then the usage pattern will have
   * emerged and we can abstract the database away.
   */
  db: () => db
}
