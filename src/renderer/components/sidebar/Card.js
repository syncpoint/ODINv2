/* eslint-disable react/prop-types */
import React from 'react'
import * as Extent from 'ol/extent'
import { TAG } from './tags'
import { Title } from './Title'
import { useServices } from '../hooks'
import * as ID from '../../ids'
import { readFeature } from '../../model/geometry'

const useDragAndDrop = (id, acceptDrop) => {
  const { store } = useServices()
  const [dropAllowed, setDropAllowed] = React.useState(null)

  const dropEffect = event => {
    const types = [...event.dataTransfer.types]
    return acceptDrop
      ? types.some(t => t === 'text/uri-list') ? 'copy' : 'link'
      : 'none'
  }

  const handleDragOver = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(acceptDrop)
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
    if (acceptDrop) onDrop(event)
  }

  const onDrop = async event => {

    // Process files first (if any):
    const [...files] = event.dataTransfer.files
    const fileLinks = files.reduce((acc, file) => {
      const url = new URL(`file:${file.path}`)
      const value = { name: file.name, url: url.href }
      acc.push([ID.linkId(id), value])
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
        links.push([ID.linkId(id), value])
        return links
      }, fileLinks)

    store.insert(await links)
  }

  return {
    dropAllowed,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  }
}

const useController = () => {
  const { emitter, ipcRenderer, store } = useServices()

  const handleDoubleClick = id => {
    const scope = ID.scope(id)
    const handlers = {
      symbol: id => emitter.emit('command/entry/draw', { id }),
      'link+layer': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
      'link+feature': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
      marker: async id => {
        const markers = await store.values([id])
        if (markers.length !== 1) return
        const center = markers[0].geometry.coordinates
        emitter.emit('map/flyto', { center })
      },
      bookmark: async id => {
        const bookmarks = await store.values([id])
        if (bookmarks.length !== 1) return
        emitter.emit('map/goto', {
          center: bookmarks[0].center,
          resolution: bookmarks[0].resolution,
          rotation: bookmarks[0].rotation
        })
      },
      feature: async id => {
        const values = await store.values([id])
        if (values.length !== 1) return
        const feature = readFeature(values[0])
        const center = Extent.getCenter(feature?.getGeometry()?.getExtent())
        emitter.emit('map/goto', { center })
      },
      place: async id => {
        const values = await store.values([id])
        if (values.length !== 1) return
        const feature = readFeature(values[0])
        const center = Extent.getCenter(feature?.getGeometry()?.getExtent())
        emitter.emit('map/goto', { center })
      }
    }

    const handler = handlers[scope] || (() => {})
    handler(id)
  }

  return {
    handleDoubleClick
  }
}


/**
 *
 */
export const Card = React.forwardRef((props, ref) => {
  const acceptDrop = props.capabilities && props.capabilities.includes('DROP')
  const dragAndDrop = useDragAndDrop(props.id, acceptDrop)
  const controller = useController()

  const style = dragAndDrop.dropAllowed === true
    ? { borderStyle: 'dashed', borderColor: '#40a9ff' }
    : {}

  const tag = spec => {
    const [variant, label, action, path] = spec.split(':')
    return TAG[variant]({
      key: spec,
      id: props.id,
      spec,
      label,
      action,
      path,
      addTag: props.addTag,
      removeTag: props.removeTag,
      onTagClick: props.onTagClick,
      onTagMouseDown: props.onTagMouseDown,
      onTagMouseUp: props.onTagMouseUp
    })
  }

  const avatar = props.url &&
    <div className='avatar'>
      <img className='image' src={props.url}/>
    </div>

  const description = props.description &&
    <span className='e3de-description'>{props.description}</span>

  return (
    <div className='e3de-card-container' ref={ref}>
      <div
        className='e3de-card e3de-column'
        style={style}
        aria-selected={props.selected}
        onClick={event => props.onEntryClick(props.id, event)}
        onDoubleClick={() => controller.handleDoubleClick(props.id)}
        onDragOver={dragAndDrop.handleDragOver}
        onDragEnter={dragAndDrop.handleDragEnter}
        onDragLeave={dragAndDrop.handleDragLeave}
        onDrop={dragAndDrop.handleDrop}
      >
        <div className='header e3de-row'>
          <Title
            id={props.id}
            value={props.title}
            editing={props.editing}
            onTitleChange={props.onTitleChange}
          />
        </div>
        <div className='body e3de-row'>
          {description}
          { avatar }
        </div>
        <div className='e3de-taglist'>
          {
            props.tags.split(' ').map(spec => tag(spec))
          }
        </div>
      </div>
    </div>
  )
})

Card.displayName = 'Card'
Card.whyDidYouRender = true

/**
 * react-cool-virtual rerenders children quite often because of
 * seemingly insignificant changes in items array. To prevent
 * unnecesary Card rerenders, we shallow compare its props through
 * React.memo().
 */
export const MemoizedCard = React.memo(Card)
MemoizedCard.whyDidYouRender = true
