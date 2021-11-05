import React from 'react'
import { render, waitFor, act, fireEvent } from '@testing-library/react'

import { sleep, queryKey } from '../../core/tests/utils'
import { Blink } from './utils'
import { QueryClient, QueryClientProvider, useQuery } from '../..'

const payload = 'Hello world'
const myError = 'MyError'

function renderWithClient(client, ui) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  )
  return {
    ...result,
    rerender: (rerenderUi) =>
      rerender(
        <QueryClientProvider client={client}>{rerenderUi}</QueryClientProvider>
      ),
  }
}

function setActTimeout(fn, ms) {
  setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

describe('useQuery', () => {
  let client
  let fetchFn
  let key
  beforeEach(() => {
    client = new QueryClient()
    key = queryKey()
    fetchFn = jest.fn(async (str) => {
      await sleep(10)
      return str || payload
    })
  })
  afterEach(() => {
    client.clear()
    fetchFn = null
  })
  test('Allow to set a default value', async () => {
    function Page() {
      const { data = 'default' } = useQuery(key, () => fetchFn())
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    const rendered = renderWithClient(client, <Page />)
    rendered.getByText('default')
    await waitFor(() => rendered.getByText(payload))
  })
  test('Can fetch from cache with no wait', async () => {
    const cache = {
      [key]: {
        data: payload,
      },
    }
    client = new QueryClient({ cache })
    function Page() {
      const { data } = useQuery(key, () => fetchFn())
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    const rendered = renderWithClient(client, <Page />)
    rendered.getByText(payload)
  })
  test('Will pass error if failed', async () => {
    const fetchFnCustom = jest.fn(async () => {
      await sleep(100)
      throw new Error(myError)
    })
    function Page() {
      const { isLoading, error } = useQuery(key, () => fetchFnCustom())
      if (isLoading) {
        return <div>Loading</div>
      }
      if (error) {
        return <div>{error.message}</div>
      }
    }
    const rendered = renderWithClient(client, <Page />)
    rendered.getByText('Loading')
    await waitFor(() => rendered.getByText(myError))
  })
  test('Will update a prefetch query if cacheTime is set to 0', async () => {
    client = new QueryClient({
      defaultOptions: {
        cacheTime: 0,
        keepPreviousData: true,
      },
    })
    await client.prefetchQuery(key, () => 'prefetched')
    const states = []
    function Page() {
      const state = useQuery(key, () => fetchFn())
      states.push(state)
      return <div>{state.data}</div>
    }
    const rendered = renderWithClient(client, <Page />)
    rendered.getByText('prefetched')
    await waitFor(() => rendered.getByText(payload))
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isLoading: true,
    })
    expect(states[1]).toMatchObject({
      data: payload,
      isLoading: false,
    })
  })
  test('Should not try to update an unmounted comp', async () => {
    const states = []
    function Page() {
      const [show, setShow] = React.useState(true)
      React.useEffect(() => {
        setShow(false)
      }, [setShow])

      return show ? <Component /> : null
    }
    function Component() {
      const state = useQuery(key, () => fetchFn())
      states.push(state)
      return <div>{state.data}</div>
    }
    renderWithClient(client, <Page />)
    await sleep(50)
    expect(states.length).toBe(1)
  })
  test('Handle multiple fetches for same key', async () => {
    const states = []
    function Page() {
      const state = useQuery(key, () => fetchFn())
      const state2 = useQuery(key, () => fetchFn())
      states.push(state)
      return (
        <div>
          {state.data} {state2.data}
        </div>
      )
    }
    renderWithClient(client, <Page />)
    await waitFor(() => expect(states.length).toBe(2))
    expect(states.length).toBe(2)
  })
  test('should create a new query when re-mounting with cacheTime 0', async () => {
    const states = []
    function Page() {
      const [toggle, setToggle] = React.useState(false)
      React.useEffect(() => {
        setActTimeout(() => {
          setToggle(true)
        }, 20)
      }, [setToggle])
      return toggle ? <Component key="1" /> : <Component key="2" />
    }
    function Component() {
      const state = useQuery(
        key,
        async () => {
          await sleep(5)
          return 'data'
        },
        {
          cacheTime: 0,
        }
      )
      states.push(state)
      return null
    }
    renderWithClient(client, <Page />)
    await waitFor(() => expect(states.length).toBe(4))
    expect(states[0]).toMatchObject({ isLoading: true })
    expect(states[2]).toMatchObject({ isLoading: true })
    expect(states[1]).toMatchObject({ isLoading: false })
    expect(states[3]).toMatchObject({ isLoading: false })
  })
  test('should not fetch if data has been fetched already', async () => {
    const key = queryKey()
    const states = []
    await client.prefetchQuery(key, () => 'prefetched')
    function Page() {
      const state = useQuery(key, () => 'test')
      states.push(state)
      return null
    }
    renderWithClient(client, <Page />)
    await sleep(10)
    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({ data: 'prefetched' })
  })
  test('should keep the previous data when keepPreviousData is set', async () => {
    const key = queryKey()
    const states = []
    function Page() {
      const [count, setCount] = React.useState(0)
      const state = useQuery(
        `${key}${count}`,
        async () => {
          await sleep(5)
          return count
        },
        { keepPreviousData: true }
      )
      states.push(state)

      React.useEffect(() => {
        setActTimeout(() => {
          setCount(1)
        }, 20)
      }, [])

      return null
    }

    renderWithClient(client, <Page />)

    await waitFor(() => expect(states.length).toBe(4))
    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isLoading: true,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isLoading: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 0,
      isLoading: true,
    })
    // Hook state update
    expect(states[3]).toMatchObject({
      data: 1,
      isLoading: false,
    })
  })
  test('should transition to error state when keepPreviousData is set', async () => {
    const states = []
    function Page({ count }) {
      const state = useQuery(
        `${key}${count}`,
        async () => {
          if (count === 2) {
            throw new Error('Error test')
          }
          return Promise.resolve(count)
        },
        {
          keepPreviousData: true,
        }
      )
      states.push(state)
      return (
        <div>
          <h1>data: {state.data}</h1>
          <h2>error: {state.error?.message}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(client, <Page count={0} />)
    await waitFor(() => rendered.getByText('data: 0'))
    act(() => rendered.rerender(<Page count={1} />))
    await waitFor(() => rendered.getByText('data: 1'))
    act(() => rendered.rerender(<Page count={2} />))
    await waitFor(() => rendered.getByText('error: Error test'))

    expect(states.length).toBe(6)
    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isLoading: true,
      error: undefined,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isLoading: false,
      error: undefined,
    })
    // rerender Page 1
    expect(states[2]).toMatchObject({
      data: 0,
      isLoading: true,
      error: undefined,
    })
    // New data
    expect(states[3]).toMatchObject({
      data: 1,
      isLoading: false,
      error: undefined,
    })
    // rerender Page 2
    expect(states[4]).toMatchObject({
      data: 1,
      isLoading: true,
      error: undefined,
    })
    // Error
    expect(states[5]).toMatchObject({
      data: undefined,
      isLoading: false,
    })
    expect(states[5]?.error).toHaveProperty('message', 'Error test')
  })
  test('should render correct states even in case of useEffect triggering delays', async () => {
    const states = []

    const originalUseEffect = React.useEffect

    // Try to simulate useEffect timing delay
    React.useEffect = (...args) => {
      originalUseEffect(() => {
        setTimeout(() => {
          args[0]()
        }, 10)
      }, args[1])
    }

    function Page() {
      const state = useQuery(key, () => 'data')
      states.push(state)
      return null
    }

    renderWithClient(client, <Page />)
    client.setQueryData(key, 'data')
    await waitFor(() => expect(states.length).toBe(2))
    React.useEffect = originalUseEffect

    expect(states[0]).toMatchObject({ isLoading: true })
    expect(states[1]).toMatchObject({ isLoading: false, data: 'data' })
  })
  test('should batch re-renders', async () => {
    let renders = 0
    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    function Page() {
      useQuery(key, queryFn)
      useQuery(key, queryFn)
      renders++
      return null
    }
    renderWithClient(client, <Page />)
    await waitFor(() => expect(renders).toBe(2))
  })
  test('should render latest data even if react has discarded certain renders', async () => {
    function Page() {
      const [, setNewState] = React.useState('state')
      const state = useQuery(key, () => 'data')
      React.useEffect(() => {
        setActTimeout(() => {
          client.setQueryData(key, 'new')
          // Update with same state to make react discard the next render
          setNewState('state')
        }, 10)
      }, [])
      return <div>{state.data}</div>
    }
    const rendered = renderWithClient(client, <Page />)
    await waitFor(() => rendered.getByText('new'))
  })
  test('should set status to error if queryFn throws', async () => {
    function Page() {
      const { error } = useQuery(key, () => {
        return Promise.reject(new Error('Error test jaylen'))
      })
      return (
        <div>
          <h2>{error && error.message}</h2>
        </div>
      )
    }
    const rendered = renderWithClient(client, <Page />)
    await waitFor(() => rendered.getByText('Error test jaylen'))
  })
  test('should fetch on mount when a query was already created with setQueryData', async () => {
    const states = []
    client.setQueryData(key, 'prefetched')
    function Page() {
      const state = useQuery(key, () => 'data', {
        cacheTime: 0,
        keepPreviousData: true,
      })
      states.push(state)
      return null
    }
    renderWithClient(client, <Page />)
    await waitFor(() => expect(states.length).toBe(2))
    expect(states).toMatchObject([
      {
        data: 'prefetched',
        isLoading: true,
      },
      {
        data: 'data',
        isLoading: false,
      },
    ])
  })
  test('should refetch if stale after a prefetch', async () => {
    const states = []
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')
    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(() => 'not yet...')
    await client.prefetchQuery(key, prefetchQueryFn, {
      cacheTime: 10,
    })
    await sleep(11)

    function Page() {
      const state = useQuery(key, queryFn)
      states.push(state)
      return null
    }

    renderWithClient(client, <Page />)
    await waitFor(() => expect(states.length).toBe(2))
    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
  test('should not refetch if not stale after a prefetch', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(async () => {
      await sleep(10)
      return 'not yet...'
    })

    await client.prefetchQuery(key, prefetchQueryFn, {
      cacheTime: 1000,
    })
    await sleep(0)
    function Page() {
      useQuery(key, queryFn, {
        cacheTime: 1000,
      })
      return null
    }
    renderWithClient(client, <Page />)
    await sleep(0)
    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })
  test('should mark query as fetching, when using initialData', async () => {
    const states = []
    function Page() {
      const state = useQuery(key, () => 'serverData', {
        cacheTime: 0,
        keepPreviousData: true,
      })
      states.push(state)
      return null
    }
    client.setQueryData(key, 'data')
    renderWithClient(client, <Page />)
    await waitFor(() => sleep(10))
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 'data', isLoading: true })
    expect(states[1]).toMatchObject({ data: 'serverData', isLoading: false })
  })
  test('should initialize state properly, when initialData is falsy', async () => {
    const states = []
    function Page() {
      const state = useQuery(key, () => 1, {
        cacheTime: 0,
        keepPreviousData: true,
      })
      states.push(state)
      return null
    }
    client.setQueryData(key, 0)
    renderWithClient(client, <Page />)
    await waitFor(() => sleep(10))
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 0, isLoading: true })
    expect(states[1]).toMatchObject({ data: 1, isLoading: false })
  })
  test('should perist to cache after unmount', async () => {
    function Page() {
      const query = useQuery(key, () => 'fetched data', {
        cacheTime: Infinity,
      })
      return <div>{query.data}</div>
    }
    const rendered = renderWithClient(client, <Page />)
    await waitFor(() => rendered.getByText('fetched data'))
    rendered.unmount()
    const cacheItem = client.getCache()[key]
    expect(cacheItem.data).toEqual('fetched data')
  })
  test('should not cause memo churn when data does not change', async () => {
    const queryFn = jest.fn()
    const memoFn = jest.fn()
    function Page() {
      const result = useQuery(key, async () => {
        await sleep(10)
        queryFn()
        return {
          data: {
            nested: true,
          },
        }
      })
      React.useMemo(() => {
        memoFn()
        return result.data
      }, [result.data])
      return (
        <div>
          <div>status {result.status}</div>
          <div>isFetching {result.isLoading ? 'true' : 'false'}</div>
          <button onClick={() => result.refetch()}>refetch</button>
        </div>
      )
    }
    const rendered = renderWithClient(client, <Page />)
    await waitFor(() => rendered.getByText('status loading'))
    await waitFor(() => rendered.getByText('status success'))
    fireEvent.click(rendered.getByText('refetch'))
    await waitFor(() => rendered.getByText('isFetching true'))
    await waitFor(() => rendered.getByText('isFetching false'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })
  test('should accept an empty string as query key', async () => {
    function Page() {
      const result = useQuery('', (ctx) => ctx.queryKey)
      return <>{JSON.stringify(result.data)}</>
    }
    const rendered = renderWithClient(client, <Page />)
    await waitFor(() => rendered.getByText(''))
  })
  test('should cancel the query function when there are no more subscriptions', async () => {
    let cancelFn = jest.fn()
    const queryFn = () => {
      const promise = new Promise((resolve, reject) => {
        cancelFn = jest.fn(() => reject(new Error('Cancelled')))
        sleep(10).then(() => resolve('OK'))
      })
      promise.cancel = cancelFn
      return promise
    }
    function Page() {
      const state = useQuery(key, queryFn)
      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }
    const rendered = renderWithClient(
      client,
      <Blink duration={5}>
        <Page />
      </Blink>
    )
    await waitFor(() => rendered.getByText('off'))
    expect(cancelFn).toHaveBeenCalled()
  })
  test('should refetch when query key changed when previous status is error', async () => {
    function Page({ id }) {
      const { error, isLoading } = useQuery(id, async () => {
        await sleep(10)
        if (id % 2 === 1) {
          return Promise.reject(new Error('Error'))
        } else {
          return 'data'
        }
      })
      if (isLoading) {
        return <div>status: loading</div>
      }
      if (error) {
        return <div>error</div>
      }
      return <div>rendered</div>
    }
    function App() {
      const [id, changeId] = React.useReducer((x) => x + 1, 1)
      return (
        <div>
          <Page id={id} />
          <button aria-label="change" onClick={changeId}>
            change {id}
          </button>
        </div>
      )
    }
    const rendered = renderWithClient(client, <App />)
    // initial state check
    rendered.getByText('status: loading')
    // render error state component
    await waitFor(() => rendered.getByText('error'))
    // change to unmount query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('rendered'))
    // change to mount new query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('error'))
  })
  it('should refetch when query key changed when switching between erroneous queries', async () => {
    function Page({ id }) {
      const { error, isLoading } = useQuery(id, async () => {
        await sleep(10)
        return Promise.reject(new Error('Error'))
      })
      if (isLoading) {
        return <div>status: fetching</div>
      }
      if (error instanceof Error) {
        return <div>error</div>
      }
      return <div>rendered</div>
    }
    function App() {
      const [value, toggle] = React.useReducer((x) => !x, true)
      return (
        <div>
          <Page id={value} />
          <button aria-label="change" onClick={toggle}>
            change {value}
          </button>
        </div>
      )
    }
    const rendered = renderWithClient(client, <App />)
    // initial state check
    rendered.getByText('status: fetching')
    // render error state component
    await waitFor(() => rendered.getByText('error'))
    // change to mount second query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('status: fetching'))
    await waitFor(() => rendered.getByText('error'))
    // change to mount first query again
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('status: fetching'))
    await waitFor(() => rendered.getByText('error'))
  })
})
