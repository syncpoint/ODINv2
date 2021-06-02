import React from 'react'
import PropTypes from 'prop-types'

export const ProjectMedia = props => {
  const width = 320 * 0.75
  const height = 240 * 0.75
  const [source, setSource] = React.useState(undefined)

  React.useEffect(async () => {
    const source = await props.loadPreview()
    setSource(source)
  }, [])

  const preview = (text = null) => (
    <div className='preview' style={{ width: `${width}px`, height: `${height}px` }}>
      { text }
    </div>
  )

  return source === undefined
    ? preview()
    : source !== null
      ? <img src={source} width={`${width}px`} height={`${height}px`}/>
      : preview('Preview not available')
}

ProjectMedia.propTypes = {
  loadPreview: PropTypes.func.isRequired
}
