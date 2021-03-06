import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from './QueryClientProvider'
import QueryObserver from '../core/QueryObserver'
import { notifyManager } from '../core/notifyManager'

function useQuery(queryKey, fetcher, options) {
  const mountedRef = useRef()
  const [, forceUpdate] = useState(0)
  const queryClient = useQueryClient()
  const [observer] = useState(() => new QueryObserver(queryClient))

  const result = observer.getOptimisticResult(queryKey, fetcher, options)
  useEffect(() => {
    mountedRef.current = true
    const unsubscribe = observer.subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          forceUpdate((x) => x + 1)
        }
      })
    )
    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [observer, forceUpdate])
  return result
}

export default useQuery
