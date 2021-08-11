import React from 'react'
import { Input } from 'antd'

export const CommandPalette = () => {

  return (
    <div className='palette-container fullscreen'>
      <div className='palette'>
        <div className='panel'>
          <Input
            size='large'
            autoFocus
            allowClear
          />
        </div>
        <div className='panel' style={{ height: '100%' }}/>
      </div>
    </div>
  )
}
