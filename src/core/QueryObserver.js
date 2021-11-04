import { QueryStates } from './Query'

function shallowEqualObjects(a, b) {
  if ((a && !b) || (b && !a)) {
    return false
  }

  for (const key in a) {
    if (a[key] !== b[key]) {
      return false
    }
  }

  return true
}

class QueryObserver {
  constructor(client) {
    this.client = client
    this.listeners = []
    this.query = null
    this.prevData = null
  }
  destroy() {
    this.client = null
    this.listeners = []
    this.query = null
    this.prevData = null
  }
  refetch = async () => {
    await this.query.run()
  }
  createResult() {
    const { data, error, state, fetchTime } = this.query
    const params = {
      isLoading: false,
      data: null,
      error: null,
      refetch: this.refetch,
      fetchTime,
    }
    if (data) {
      if (this.prevData) {
        this.prevData = null
      }
      return {
        ...params,
        data,
      }
    }
    if (error && state === QueryStates.FAILED) {
      return {
        ...params,
        error,
      }
    }
    return {
      ...params,
      data: this.prevData || params.data,
      isLoading: true,
    }
  }
  queryHasChange() {
    const prevResults = this.currentResults
    const results = this.createResult()
    const hasChanged = !shallowEqualObjects(prevResults, results)
    return hasChanged
  }
  notify = () => {
    if (this.queryHasChange()) {
      this.updateResult()
      const { data, error } = this.query
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
