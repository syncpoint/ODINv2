import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'

export const CustomButton = props => (
  <Button
    danger={props.danger}
    onClick={props.onClick}
    style={{ ...props.style, background: 'inherit' }}
  >
    {props.text}
  </Button>
)

CustomButton.propTypes = {
  danger: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object,
  text: PropTypes.string.isRequired
}
