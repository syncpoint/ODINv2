import React from 'react'
import PropTypes from 'prop-types'
import uuid from 'uuid-random'
import { CardTitle } from './CardTitle'
import { useServices } from './hooks'

export const Card = React.forwardRef((props, ref) => {
  const { store } = useServices()
  const { id, children, selected, capabilities } = props
  const [dropAllowed, setDropAllowed] = React.useState(null)

  const style = dropAllowed === true
    // ? { backgroundColor: '#f1eff0', borderStyle: 'dashed', borderColor: 'black' } // Off White
    ? { borderStyle: 'dashed', borderColor: '#40a9ff' } // (antd) hover border-color
    : {}

  const className = props.focused
    ? 'card focus'
    : 'card'

  const handleClick = event => {
    props.onClick && props.onClick(event)
  }

  const handleDoubleClick = event => {
    props.onDoubleClick && props.onDoubleClick(event)
  }

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

  const handleDrop = event => {
    event.preventDefault()
    setDropAllowed(null)

    if (capabilities && capabilities.includes('DROP')) {
      const links = []

      for (const file of event.dataTransfer.files) {
        const url = new URL(`file:${file.path}`)
        links.push({ id: `link+${id}/${uuid()}`, name: file.name, url: url.href })
      }

      for (const item of event.dataTransfer.items) {
        if (item.type === 'text/uri-list') {
          item.getAsString(function (arg) {
            const url = new URL(arg)
            if (url.hostname && url.href) {
              links.push({ id: `link+${id}/${uuid()}`, name: url.origin, url: url.href })
            }
          })
        }
      }

      store.insert(links)
    }
  }

  return (
    <div
      ref={ref}
      className={className}
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
  focused: PropTypes.bool,
  selected: PropTypes.bool,
  capabilities: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func
}

Card.Title = CardTitle
