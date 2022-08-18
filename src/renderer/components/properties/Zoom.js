/* eslint-disable react/prop-types */
import React from 'react'
import Range from './Range'

const Zoom = props => {

  const [maxZoom, setMaxZoom] = React.useState(props.maxZoom || 24)

  React.useEffect(() => {
    props.onChange({ maxZoom })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxZoom])

  const handleMax = ({ target }) => {
    const max = Number.parseInt(target.value)
    setMaxZoom(max)
  }

  const options = (range) => {
    return range.map(value => <option key={value} value={value} label={value}></option>)
  }

  return (
    <div>
        <label id='maxZoom'>Max. zoom level: <b>{maxZoom}</b></label>
        <Range
          min='1'
          max='24'
          step='1'
          value={maxZoom}
          onChange={handleMax}
        >
          { options([1, 6, 12, 18, 24]) }
        </Range>
      </div>
  )
}

export default Zoom
