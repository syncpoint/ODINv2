import React from 'react'
import PropTypes from 'prop-types'
import { CardTitle } from './CardTitle'
import { CardContent } from './CardContent'
import { CardDescription } from './CardDescription'
import { useServices } from './hooks'
import { linkId } from '../ids'
import './Card.css'

export const Card = React.forwardRef((props, ref) => {
  const { featureStore } = useServices()
  const { id, children, selected, capabilities } = props
  const [dropAllowed, setDropAllowed] = React.useState(null)

  const style = dropAllowed === true
    // ? { backgroundColor: '#f1eff0', borderStyle: 'dashed', borderColor: 'black' } // Off White
    ? { borderStyle: 'dashed', borderColor: '#40a9ff' } // (antd) hover border-color
    : {}

  // Only used to forward click event to focus/selection strategy:
  const handleClick = event => props.onClick && props.onClick(event)
  const handleDoubleClick = event => props.onDoubleClick && props.onDoubleClick(event)

  const dropEffect = event => {
    const types = [...event.dataTransfer.types]
    if (!capabilities || !capabilities.includes('DROP')) return 'none'
    else return types.some(t => t === 'text/uri-list') ? 'copy' : 'link'
  }

  const handleDragOver = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)

    // allow drop if supported
    if (capabilities && capabilities.includes('DROP')) setDropAllowed(true)
    else setDropAllowed(false)
  }

  const handleDragEnter = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
  }

  const handleDragLeave = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(null)
  }

  const handleDrop = async event => {
    event.preventDefault()
    setDropAllowed(null)

    if (capabilities && capabilities.includes('DROP')) {

      // Process files first (if any):
      const [...files] = event.dataTransfer.files
      const fileLinks = files.reduce((acc, file) => {
        const url = new URL(`file:${file.path}`)
        const value = { name: file.name, url: url.href }
        acc.push([linkId(id), value])
        return acc
      }, [])

      // Append possible items to existing file links:
      const getAsString = item => new Promise(resolve => item.getAsString(resolve))
      const [...items] = event.dataTransfer.items

      const links = items
        .filter(item => item.type === 'text/uri-list')
        .reduce(async (acc, item) => {
          const arg = await getAsString(item)

          const url = new URL(arg)
          if (!url.hostname || !url.href) return acc

          const value = { name: url.origin, url: url.href }
          const links = await acc
          links.push([linkId(id), value])
          return links
        }, fileLinks)

      featureStore.insert(await links)
    }
  }

  return (
    <div
      ref={ref}
      className='card'
      style={style}
      aria-selected={selected}
      role='option'
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  )
})

Card.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  selected: PropTypes.bool,
  editing: PropTypes.bool,
  capabilities: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func
}

Card.Title = CardTitle
Card.Content = CardContent
Card.Description = CardDescription
