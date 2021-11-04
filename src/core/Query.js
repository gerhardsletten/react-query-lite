import { now } from './utils'

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
    data = null,
    fetchTime = null,
    error = null,
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
  async run() {
    this.state = QueryStates.PENDING
    if (!this.options.keepPreviousData) {
      this.data = null
    }
    this.error = null
    try {
      this.data = await this.fetchFn()
      this.state = QueryStates.FULLFILLED
      const prevFetchTime = this.fetchTime
      this.fetchTime = Math.max(new Date().getTime(), prevFetchTime + 1)
      this.client.cache[this.key] = {
        fetchTime: this.fetchTime,
        data: this.data,
      }
    } catch (error) {
      this.error = error
      this.state = QueryStates.FAILED
    }
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
