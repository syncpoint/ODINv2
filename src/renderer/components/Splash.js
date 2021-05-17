import React from 'react'
import * as Registry from '../registry'

export const Splash = () => {

  React.useEffect(async () => {
    const master = Registry.get(Registry.MASTER)
    const projects = await new Promise((resolve, reject) => {
      const acc = []
      master.createReadStream({ keys: true, values: true, gte: 'project:', lte: 'project:\xff' })
        .on('data', data => acc.push(data))
        .on('error', err => reject(err))
        .on('end', () => resolve(acc))
    })

    console.log('projects', projects)
  }, [])

  return <div>Splash</div>
}
