import React from 'react'
import PropTypes from 'prop-types'

export const Media = props => {
  const scale = 0.5
  const width = `${320 * scale}px`
  const height = `${240 * scale}px`
  const [source, setSource] = React.useState(undefined)

  React.useEffect(async () => {
    const source = await props.loadPreview()
    setSource(source)
  }, [])

  const placeholder = (text = null) => (
    <div className='placeholder' style={{ width, height }}>
      { text }
    </div>
  )

  return source === undefined
    ? placeholder()
    : source === null
      ? placeholder('Preview not available')
      : <img src={source} width={width} height={height}/>
}

Media.propTypes = {
  loadPreview: PropTypes.func.isRequired
}
