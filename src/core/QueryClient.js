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
  getOrCreateQuery({ queryKey, fetchFn, options, callback }) {
    const foundQuery = this.queries.find((item) => item.queryKey === queryKey)
    if (foundQuery) {
      foundQuery.subscribe(callback)
      if (shouldFetchQuery(foundQuery)) {
        foundQuery.run()
      }
      return foundQuery
    }
    const cacheOptions =
      this.cache[queryKey] && this.cache[queryKey].options
        ? this.cache[queryKey].options
        : {}
    const query = new Query({
      queryKey,
      fetchFn,
      data: this.cache[queryKey] && this.cache[queryKey].data,
      fetchTime: this.cache[queryKey] && this.cache[queryKey].fetchTime,
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
  setQueryData(queryKey, data) {
    const foundQuery = this.queries.find((item) => item.queryKey === queryKey)
    if (foundQuery && foundQuery.data !== data) {
      foundQuery.setData(data)
    } else {
      if (this.cache[queryKey]) {
        this.cache[queryKey].data = data
      } else {
        this.cache[queryKey] = { data }
      }
    }
  }
  prefetchQuery(queryKey, fetchFn, options) {
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
      const query = this.getOrCreateQuery({
        queryKey,
        fetchFn,
        options,
        callback,
      })
      if (query.data) {
        query.unsubscribe(callback)
        resolve(query.data)
      }
    })
  }
}

export default QueryClient
