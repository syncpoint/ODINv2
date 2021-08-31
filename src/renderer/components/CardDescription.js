import React from 'react'
import PropTypes from 'prop-types'

const CardDescription = props => {
  const text = props.value &&
    <span className='card-description'>{props.value}</span>
  return <div>{text}</div>
}

CardDescription.propTypes = {
  value: PropTypes.string
}

CardDescription.whyDidYouRender = true

const CardDescriptionMemo = React.memo(CardDescription)
CardDescriptionMemo.whyDidYouRender = true

export { CardDescriptionMemo as CardDescription }
