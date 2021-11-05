import { QueryStates } from './Query'
import { shallowEqualObjects } from './utils'

class QueryObserver {
  constructor(client) {
    this.client = client
    this.listeners = []
    this.query = undefined
    this.prevData = undefined
  }
  destroy() {
    this.client = undefined
    this.listeners = []
    this.query = undefined
    this.prevData = undefined
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
  getOptimisticResult(key, fetchFn, options) {
    if (!this.query || this.query.key !== key) {
      if (this.query && this.query.key !== key) {
        this.prevData = this.query.data
        this.query.unsubscribe(this.notify)
      }
      this.query = this.client.getOrCreateQuery({
        key,
        fetchFn,
        options,
        callback: this.notify,
      })
    }
    return this.updateResult()
  }
  updateResult() {
    const results = this.createResult()
    this.currentResults = results
    return results
  }
  subscribe(callback) {
    this.listeners.push(callback)
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
