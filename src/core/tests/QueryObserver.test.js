import QueryClient from '../QueryClient'
import QueryObserver from '../QueryObserver'
import { sleep, queryKey } from './utils'

function subscribe(observer) {
  return new Promise((resolve) => {
    const callback = observer.subscribe(() => {
      resolve(callback)
    })
  })
}

const payload = 'Hello world'
const myError = 'MyError'

describe(`QueryObserver`, () => {
  let client
  let fetchFn
  let key
  beforeEach(() => {
    client = new QueryClient()
    key = queryKey()
    fetchFn = jest.fn(async (str) => {
      await sleep(100)
      return str || payload
    })
  })
  afterEach(() => {
    client.clear()
    fetchFn = null
  })
  it(`Can perform a fetch`, async () => {
    const observer = new QueryObserver(client)
    let data = observer.getOptimisticResult(key, () => fetchFn())
    expect(data.isLoading).toEqual(true)
    expect(data.data).toEqual(undefined)
    await subscribe(observer)
    data = observer.getOptimisticResult(key, () => fetchFn())
    expect(data.isLoading).toEqual(false)
    expect(data.data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(1)
  })
  it(`Can fetch from cache`, async () => {
    const cache = {
      [key]: {
        data: payload,
      },
    }
    client = new QueryClient({ cache })
    const observer = new QueryObserver(client)
    const data = observer.getOptimisticResult(key, () => fetchFn())
    const callback = jest.fn()
    const unSubscribe = observer.subscribe(callback)
    expect(data.isLoading).toEqual(false)
    expect(data.data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(0)
    expect(callback.mock.calls.length).toEqual(0)
    unSubscribe()
  })
  it(`Should return a error if failed`, async () => {
    const observer = new QueryObserver(client)
    const fetchFnCustom = jest.fn(async () => {
      await sleep(100)
      throw new Error(myError)
    })
    let data = observer.getOptimisticResult(key, () => fetchFnCustom())
    expect(data.isLoading).toEqual(true)
    expect(data.error).toEqual(undefined)
    await subscribe(observer)
    data = observer.getOptimisticResult(key, () => fetchFnCustom())
    expect(data.isLoading).toEqual(false)
    expect(data.error.message).toEqual(myError)
  })
  it(`Should be able to refetch and get success after error`, async () => {
    const observer = new QueryObserver(client)
    let shouldThrow = true
    const fetchFnCustom = jest.fn(async () => {
      await sleep(100)
      if (shouldThrow) {
        throw new Error(myError)
      }
      return payload
    })
    observer.getOptimisticResult(key, () => fetchFnCustom())
    await subscribe(observer)
    let data = observer.getOptimisticResult(key, () => fetchFnCustom())
    expect(data.isLoading).toEqual(false)
    expect(data.error.message).toEqual(myError)
    shouldThrow = false
    data.refetch()
    data = observer.getOptimisticResult(key, () => fetchFnCustom())
    expect(data.isLoading).toEqual(true)
    expect(data.error).toEqual(undefined)
    expect(data.data).toEqual(undefined)
    await subscribe(observer)
    data = observer.getOptimisticResult(key, () => fetchFnCustom())
    expect(data.isLoading).toEqual(false)
    expect(data.error).toEqual(undefined)
    expect(data.data).toEqual(payload)
  })
  it(`Will clean up on unsubscribe`, async () => {
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    const unSubscribe = await subscribe(observer)
    unSubscribe()
    expect(observer.query).toEqual(undefined)
    expect(observer.client).toEqual(undefined)
    expect(observer.listeners).toEqual([])
  })
  it(`Should not notify if nothing has changed`, async () => {
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    const callback = jest.fn()
    const unSubscribe = observer.subscribe(callback)
    const observer2 = new QueryObserver(client)
    observer2.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer2)
    expect(callback.mock.calls.length).toEqual(1)
    unSubscribe()
  })
  it(`Refresh should trigger an updatde`, async () => {
    const observer = new QueryObserver(client)
    const { refetch } = observer.getOptimisticResult(key, () => fetchFn())
    const callback = jest.fn()
    const unSubscribe = observer.subscribe(callback)
    await refetch()
    expect(callback.mock.calls.length).toEqual(2)
    unSubscribe()
  })
  it(`Multiple observer result in one fetch`, async () => {
    const observer = new QueryObserver(client)
    const observer2 = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    observer2.getOptimisticResult(key, () => fetchFn())
    await Promise.all([subscribe(observer), subscribe(observer2)])
    const data = observer.getOptimisticResult(key, () => fetchFn())
    expect(data.isLoading).toEqual(false)
    expect(data.data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(1)
  })
  it(`Can use cacheTime option with refetch`, async () => {
    client = new QueryClient({
      defaultOptions: {
        cacheTime: 0,
      },
    })
    const observer = new QueryObserver(client)
    const { refetch } = observer.getOptimisticResult(key, () => fetchFn())
    const callback = jest.fn()
    const unSubscribe = observer.subscribe(callback)
    await refetch()
    await refetch()
    // 2 x loading, 2 x success
    expect(callback.mock.calls.length).toEqual(4)
    expect(fetchFn.mock.calls.length).toEqual(3)
    unSubscribe()
  })
  it(`Can use cacheTime option with multiple observers`, async () => {
    client = new QueryClient({
      defaultOptions: {
        cacheTime: 0,
      },
    })
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer)
    const observer2 = new QueryObserver(client)
    observer2.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer2)
    expect(fetchFn.mock.calls.length).toEqual(2)
  })
  it(`Can use higher cacheTime option with multiple observers`, async () => {
    client = new QueryClient({
      defaultOptions: {
        cacheTime: 1000,
      },
    })
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer)
    const observer2 = new QueryObserver(client)
    observer2.getOptimisticResult(key, () => fetchFn())
    await sleep(200)
    expect(fetchFn.mock.calls.length).toEqual(1)
  })
  it(`Can use option keepPreviousData`, async () => {
    client = new QueryClient({
      defaultOptions: {
        keepPreviousData: true,
      },
    })
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer)
    let data = observer.getOptimisticResult(key, () => fetchFn())
    expect(data.data).toEqual(payload)
    const key2 = queryKey()
    const payload2 = 'Hello world II'
    data = observer.getOptimisticResult(key2, () => fetchFn(payload2))
    expect(data.data).toEqual(payload)
    expect(data.isLoading).toEqual(true)
    await subscribe(observer)
    data = observer.getOptimisticResult(key2, () => fetchFn(payload2))
    expect(data.data).toEqual(payload2)
    expect(data.isLoading).toEqual(false)
  })
  it(`Can use option keepPreviousData with refresh`, async () => {
    client = new QueryClient({
      defaultOptions: {
        cacheTime: 0,
        keepPreviousData: false,
      },
    })
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn())
    await subscribe(observer)
    let result = observer.getOptimisticResult(key, () => fetchFn())
    expect(result.data).toEqual(payload)
    result.refetch()
    result = observer.getOptimisticResult(key, () => fetchFn())
    expect(result.isLoading).toEqual(true)
    // expect(result.data).toEqual(undefined)
    await subscribe(observer)
    result = observer.getOptimisticResult(key, () => fetchFn())
    expect(result.data).toEqual(payload)
  })
  it(`Can pass options to getOptimisticResult`, async () => {
    const options = {
      cacheTime: 0,
      keepPreviousData: false,
    }
    const observer = new QueryObserver(client)
    observer.getOptimisticResult(key, () => fetchFn(), options)
    await subscribe(observer)
    expect(observer.query.options.cacheTime).toEqual(options.cacheTime)
    expect(observer.query.options.keepPreviousData).toEqual(
      options.keepPreviousData
    )
  })
})
