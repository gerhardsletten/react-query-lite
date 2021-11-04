import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from './QueryClientProvider'
import QueryObserver from '../core/QueryObserver'

function batchCalls(callback) {
  return (...args) => {
    callback(...args)
  }
}

function useQuery(key, fetcher, options) {
  const mountedRef = useRef()
  const [, forceUpdate] = useState(0)
  const queryClient = useQueryClient()
  const [observer] = useState(() => new QueryObserver(queryClient))

  let result = observer.getOptimisticResult(key, fetcher, options)
  useEffect(() => {
    mountedRef.current = true
    const unsubscribe = observer.subscribe(
      batchCalls(() => {
        if (mountedRef.current) {
          forceUpdate((x) => x + 1)
        }
      })
    )
    // observer.updateResult()
    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [observer])
  return result
}

export default useQuery
