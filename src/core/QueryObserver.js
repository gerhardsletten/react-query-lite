import { QueryStates } from './Query'
import { shallowEqualObjects, invariant } from './utils'

class QueryObserver {
  constructor(client) {
    this.client = client
    this.listeners = []
  }
  destroy() {
    this.listeners = []
    this.query.unsubscribe(this.notify)
    this.query = undefined
  }
  refetch = async () => {
    await this.query.run(true)
  }
  createResult() {
    const { data, error, state, fetchTime, options = {} } = this.query || {}
    const params = {
      isLoading: state === QueryStates.PENDING,
      data,
      error: undefined,
      refetch: this.refetch,
      fetchTime,
    }
    if (state === QueryStates.FULLFILLED) {
      if (this.prevData) {
        // this.prevData = null
      }
      return {
        ...params,
        data,
        status: 'success',
      }
    }
    if (error && state === QueryStates.FAILED) {
      return {
        ...params,
        error,
        status: 'error',
      }
    }
    if (options.keepPreviousData && this.prevData !== undefined) {
      params.data = this.prevData
    }
    return {
      ...params,
      isLoading: true,
      status: 'loading',
    }
  }
  queryHasChange() {
    const prevResults = this.currentResults
    const results = this.createResult()
    const hasChanged = !shallowEqualObjects(prevResults, results)
    return hasChanged
  }
  notify = () => {
    if (this.queryHasChange() && this.listeners.length) {
      this.updateResult()
      const { data, error } = this.query || {}
      this.listeners.forEach((callback) => {
        callback(error, data)
      })
    }
  }
  getOptimisticResult(queryKey, fetchFn, options) {
    if (!this.query || this.query.queryKey !== queryKey) {
      if (this.query && this.query.queryKey !== queryKey) {
        this.prevData = this.query.data
        this.query.unsubscribe(this.notify)
      }
      this.queryKey = queryKey
      this.fetchFn = fetchFn
      this.options = options
      this.createQuery()
    }
    return this.updateResult()
  }
  createQuery() {
    this.query = this.client.getOrCreateQuery({
      queryKey: this.queryKey,
      fetchFn: this.fetchFn,
      options: this.options,
      callback: this.notify,
    })
  }
  updateResult() {
    const results = this.createResult()
    this.currentResults = results
    return results
  }
  subscribe(callback) {
    this.listeners.push(callback)
    if (!this.query) {
      invariant(
        this.queryKey && this.fetchFn,
        'Please run getOptimisticResult before subscribe'
      )
      this.createQuery()
    }
    if (this.queryHasChange()) {
      this.notify()
    }
    return () => {
      this.listeners = this.listeners.filter((x) => x !== callback)
      this.unsubscribe()
    }
  }
  unsubscribe() {
    if (!this.listeners.length) {
      this.destroy()
    }
  }
}

export default QueryObserver
