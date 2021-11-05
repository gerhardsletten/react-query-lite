import Query, { QueryStates } from './Query'
import { now } from './utils'

const options = {
  keepPreviousData: false,
  cacheTime: Infinity,
}

function shouldFetchQuery(query) {
  if (query.state === QueryStates.PENDING) {
    return false
  }
  if (query.state === QueryStates.FULLFILLED) {
    if (query.fetchTime && query.options.cacheTime !== Infinity) {
      const ms = now()
      const cacheTime = query.fetchTime + query.options.cacheTime
      const isStale = ms - cacheTime > -1
      return isStale
    }
    return false
  }
  return true
}

class QueryClient {
  constructor({ cache = undefined, defaultOptions = {} } = {}) {
    this.cache = cache || {}
    this.options = { ...options, ...defaultOptions }
    this.queries = []
  }
  getOrCreateQuery({ key, fetchFn, options, callback }) {
    const foundQuery = this.queries.find((item) => item.key === key)
    if (foundQuery) {
      foundQuery.subscribe(callback)
      if (shouldFetchQuery(foundQuery)) {
        foundQuery.run()
      }
      return foundQuery
    }
    const cacheOptions =
      this.cache[key] && this.cache[key].options ? this.cache[key].options : {}
    const query = new Query({
      key,
      fetchFn,
      data: this.cache[key] && this.cache[key].data,
      fetchTime: this.cache[key] && this.cache[key].fetchTime,
      options: { ...this.options, ...cacheOptions, ...options },
      client: this,
    })
    query.subscribe(callback)
    this.queries.push(query)
    if (shouldFetchQuery(query)) {
      query.run()
    }
    return query
  }
  onDestroyQuery(query) {
    this.queries = this.queries.filter((q) => q !== query)
  }
  getCache() {
    return this.cache
  }
  clear() {
    this.cache = {}
    this.queries = []
  }
  setQueryData(key, data) {
    const foundQuery = this.queries.find((item) => item.key === key)
    if (foundQuery && foundQuery.data !== data) {
      foundQuery.setData(data)
    } else {
      if (this.cache[key]) {
        this.cache[key].data = data
      } else {
        this.cache[key] = { data }
      }
    }
  }
  prefetchQuery(key, fetchFn, options) {
    return new Promise((resolve, reject) => {
      const callback = (query) => {
        query.unsubscribe(callback)
        if (query.error) {
          reject(query.error)
        }
        if (query.data) {
          resolve(query.data)
        }
      }
      const query = this.getOrCreateQuery({ key, fetchFn, options, callback })
      if (query.data) {
        query.unsubscribe(callback)
        resolve(query.data)
      }
    })
  }
}

export default QueryClient
