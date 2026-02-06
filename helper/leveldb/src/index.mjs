import { platform, homedir } from 'node:os'
import { join } from 'node:path'
import { Level } from 'level'

const userData = () => {
  switch (platform()) {
    case 'darwin': return join(homedir(), 'Library', 'Application Support')
    case 'win32': return join(homedir(), 'AppData', 'Roaming')
    default: return homedir()
  }
}

const handleProject = async (projectId) => {
  const id = projectId.split(':')[1]
  const db = new Level(join(databases(), id))

  db.once('ready', async () => {
    const tuples = db.sublevel('tuples')
    const keys = await tuples.keys().all()
    // console.dir(entries, { depth: 5 })

    const prefixes = [
      'link+feature',
      'feature'
    ]

    const ops = keys
      .filter(key => {
        const prefix = key.split(':')[0]
        return prefixes.includes(prefix)
      })
      .map(key => ({
        type: 'del',
        key
      }))

    if (ops.length > 0) {
      await tuples.batch(ops)
      console.log('removed features/links: ', ops.length)
    } else { console.log('No features to remove') }
  })
}

const databases = () => join(userData(), 'ODINv2', 'databases')

const masterLocation = join(databases(), 'master')

const master = new Level(masterLocation, { valueEncoding: 'json' })

master.once('ready', async () => {
  const projectsKeys = (await master.keys().all()).filter(key => key.startsWith('project:'))
  const projects = await master.getMany(projectsKeys)
  console.dir(projects, { depth: 5 })

  // handleProject(projects[0].id)
  handleProject('project:c0312dc8-20a3-4fc7-bc59-126f11f96b42')
})
