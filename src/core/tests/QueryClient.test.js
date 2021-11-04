import QueryClient from '../QueryClient'
import { sleep, queryKey } from './utils'

const payload = 'Hello world'

describe(`QueryClient`, () => {
  let client
  let fetchFn
  let key
  beforeEach(() => {
    client = new QueryClient()
    key = queryKey()
    fetchFn = jest.fn(async (str) => {
      await sleep(100)
      return str
    })
  })
  afterEach(() => {
    client.clear()
    fetchFn = null
  })
  it(`Can perform a fetch`, async () => {
    const data = await client.prefetchQuery(key, () => fetchFn(payload))
    expect(data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(1)
  })
  it(`Will load from cache`, async () => {
    const cache = {
      [key]: {
        data: payload,
      },
    }
    client = new QueryClient({ cache })
    const data = await client.prefetchQuery(key, () => fetchFn(payload))
    expect(data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(0)
  })
  it(`Will throw on error`, async () => {
    const myError = 'MyError'
    const load = jest.fn(async () => {
      await sleep(100)
      throw new Error(myError)
    })
    expect.assertions(1)
    let err
    try {
      await client.prefetchQuery(key, () => load())
    } catch (error) {
      err = error
    }
    expect(err.message).toEqual(myError)
  })
  it(`Multiple calles will only trigger one fetch`, async () => {
    const data = await Promise.all([
      await client.prefetchQuery(key, () => fetchFn(payload)),
      await client.prefetchQuery(key, () => fetchFn(payload)),
    ])
    expect(data[0]).toEqual(payload)
    expect(data[1]).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(1)
  })
  it(`Can use staleTime option`, async () => {
    client = new QueryClient({
      defaultOptions: {
        staleTime: 0,
      },
    })
    await client.prefetchQuery(key, () => fetchFn(payload))
    const data = await client.prefetchQuery(key, () => fetchFn(payload))
    expect(data).toEqual(payload)
    expect(fetchFn.mock.calls.length).toEqual(2)
  })
})
