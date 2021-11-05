import React from 'react'

export const Blink = ({ duration, children }) => {
  const [shouldShow, setShouldShow] = React.useState(true)
  React.useEffect(() => {
    setShouldShow(true)
    const timeout = setTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}
