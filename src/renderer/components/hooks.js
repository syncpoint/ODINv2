import React from 'react'

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => { setDebouncedValue(value) }, delay)
    return () => {
      console.log('killing timer')
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
