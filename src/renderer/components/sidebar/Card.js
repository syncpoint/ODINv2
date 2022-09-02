/* eslint-disable react/prop-types */
import React from 'react'
import * as Extent from 'ol/extent'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import { TAG } from './tags'
import { Title } from './Title'
import { useServices, useEmitter } from '../hooks'
import * as ID from '../../ids'
import { readFeature } from '../../model/geometry'
import './Card.scss'

/**
 *
 */
const useDragAndDrop = (id, acceptDrop) => {
  const { store } = useServices()
  const [dropAllowed, setDropAllowed] = React.useState(null)

  const dropEffect = event => {
    const types = [...event.dataTransfer.types]
    return acceptDrop
      ? types.some(t => t === 'text/uri-list') ? 'copy' : 'link'
      : 'none'
  }

  const onDragOver = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(acceptDrop)
  }

  const onDragEnter = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
  }

  const onDragLeave = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(null)
  }

  const onDrop = async event => {
    event.preventDefault()
    setDropAllowed(null)
    if (!acceptDrop) return

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
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
  }
}


/**
 *
 */
const useController = id => {
  const { emitter, ipcRenderer, store } = useServices()

  const center = async id => {
    const values = await store.values([id])
    if (values.length !== 1) return
    const entity = readFeature(values[0])
    const center = Extent.getCenter(entity?.getGeometry()?.getExtent())
    emitter.emit('map/goto', { center })
  }

  const viewport = async id => {
    const entity = await store.values([id])
    if (entity.length !== 1) return
    emitter.emit('map/goto', {
      center: entity[0].center,
      resolution: entity[0].resolution,
      rotation: entity[0].rotation
    })
  }

  const scopes = {
    symbol: id => emitter.emit('command/entry/draw', { id }),
    'link+layer': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
    'link+feature': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
    marker: async id => {
      const markers = await store.values([id])
      if (markers.length !== 1) return
      const center = markers[0].geometry.coordinates
      emitter.emit('map/flyto', { center })
    },
    bookmark: viewport,
    feature: center,
    place: center
  }

  return {
    onDoubleClick: () => (scopes[ID.scope(id)] || (() => {}))(id)
  }
}


const IconButton = props => {
  const { children, ...rest } = props
  return (
    <button className='e3de-button' {...rest}>
      {children}
    </button>
  )
}

/**
 *
 */
export const Card = React.forwardRef((props, ref) => {
  const { id, capabilities, svg, title, highlight, description, tags, selected, editing, ...rest } = props
  const acceptDrop = capabilities && capabilities.includes('DROP')
  const emitter = useEmitter('sidebar')
  const { dropAllowed, ...dragAndDrop } = useDragAndDrop(id, acceptDrop)
  const controller = useController(id)

  const pinned = tags.split(' ').findIndex(s => s.match(/USER:pin:NONE/gi)) !== -1
  const style = dropAllowed === true
    ? { border: '0.2rem dashed #40a9ff', padding: '0.38rem' }
    : {}

  const tag = spec => {
    const [variant, label, action, path] = spec.split(':')
    // TODO: use generic Tag component
    return TAG[variant]({
      key: spec,
      id,
      spec,
      label,
      action,
      path
    })
  }

  const children = {}

  children.description = description &&
    <span className='e3de-description'>{description}</span>

  children.avatar = svg &&
    <div className='avatar' dangerouslySetInnerHTML={{ __html: svg }}/>


  children.body = (svg || description) &&
    <>
      <hr></hr>
      <div className='body e3de-row'>
        {children.description}
        {children.avatar}
      </div>
    </>

  children.tags = tags.split(' ').map(spec => tag(spec))
  const handleClick = event => rest.onClick(id)(event)

  const pinPath = pinned
    ? mdi.mdiPin
    : mdi.mdiPinOutline

  return (
    <div className='e3de-card-container' ref={ref}>
      <div
        className='e3de-card e3de-column'
        style={style}
        aria-selected={selected}
        onClick={handleClick}
        {...controller}
        {...dragAndDrop}
      >
        <div className='header e3de-row'>
          <Title
            id={id}
            value={title}
            editing={editing}
            highlight={highlight}
          />
          <IconButton onClick={() => emitter.emit('edit', { id })}>
            <Icon className='e3de-icon' path={mdi.mdiPencil}/>
          </IconButton>
          <IconButton onClick={() => emitter.emit(pinned ? 'unpin' : 'pin', { id })}>
            <Icon className='e3de-icon' path={pinPath}/>
          </IconButton>
        </div>
        { children.body }
        <hr></hr>
        <div className='e3de-taglist'>
          { children.tags }
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
