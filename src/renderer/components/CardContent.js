import React from 'react'
import PropTypes from 'prop-types'

const CardContent = props => {
  return (
    <div className='card-content'>{props.children}</div>
  )
}

CardContent.propTypes = {
  children: PropTypes.node.isRequired
}

CardContent.whyDidYouRender = true

const CardContentMemo = React.memo(CardContent)
CardContentMemo.whyDidYouRender = true

export { CardContentMemo as CardContent }
