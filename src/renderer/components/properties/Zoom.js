/* eslint-disable react/prop-types */
import React from 'react'
import Range from './Range'

const Zoom = props => {

  const [minZoom, setMinZoom] = React.useState(props.minZoom || 1)
  const [maxZoom, setMaxZoom] = React.useState(props.maxZoom || 24)

  React.useEffect(() => {
    props.onChange({ minZoom, maxZoom })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minZoom, maxZoom])

  const handleMin = ({ target }) => {
    const min = Number.parseInt(target.value)
    if (min > maxZoom - 1) return
    setMinZoom(min)
  }

  const handleMax = ({ target }) => {
    const max = Number.parseInt(target.value)
    if (max < minZoom + 1) return
    setMaxZoom(max)
  }

  const options = (range) => {
    return range.map(value => <option key={value} value={value} label={value}></option>)
  }

  return (
    <div>
        <label id='minZoom'>Min. zoom level: <b>{minZoom}</b></label>
        <Range
          min='1'
          max='24'
          step='1'
          value={minZoom}
          onChange={handleMin}
        >
          { options([1, 6, 12, 18, 24]) }
        </Range>

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
