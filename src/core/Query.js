import { now, shallowEqualObjects } from './utils'

export const QueryStates = {
  INITAL: 'INITAL',
  PENDING: 'PENDING',
  FULLFILLED: 'FULLFILLED',
  FAILED: 'FAILED',
}

class Query {
  constructor({
    key,
    fetchFn,
    options = {},
    data = undefined,
    fetchTime = null,
    error = undefined,
    client,
  } = {}) {
    this.key = key
    this.state = data ? QueryStates.FULLFILLED : QueryStates.INITAL
    this.data = data
    this.error = error
    this.fetchFn = fetchFn
    this.fetchTime = data ? fetchTime || now() : null
    this.options = options
    this.listeners = []
    this.client = client
  }
  destroy() {
    this.listeners = []
    this.client.onDestroyQuery(this)
    this.client = null
    this.fetchFn = null
    this.options = null
  }
  setData(data) {
    if (data !== this.data) {
      this.data = data
      this.fetchTime = now()
      this.notify()
    }
  }
  async run(refetch) {
    this.state = QueryStates.PENDING
    if (!this.options.keepPreviousData) {
      // this.data = undefined
    }
    this.error = undefined
    if (refetch) {
      this.notify()
    }
    try {
      const data = await this.fetchFn()
      if (!this.data || !shallowEqualObjects(this.data, data, true)) {
        this.data = data
      }
      this.state = QueryStates.FULLFILLED
      const prevFetchTime = this.fetchTime
      this.fetchTime = Math.max(now(), prevFetchTime + 1)
      this.client.cache[this.key] = {
        fetchTime: this.fetchTime,
        data: this.data,
        options: this.options,
      }
    } catch (error) {
      this.error = error
      this.state = QueryStates.FAILED
    }
    this.notify()
  }
  notify() {
    this.listeners.forEach((callback) => {
      callback(this)
    })
  }
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.unsubscribe()
    }
  }
  unsubscribe(callback) {
    this.listeners = this.listeners.filter((x) => x !== callback)
    if (!this.listeners.length) {
      this.destroy()
    }
  }
}

export default Query
