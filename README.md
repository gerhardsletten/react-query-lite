# React-query-lite

The tiny react data-loader inspired by react-query

`npm i react-query-lite`

## Less impact on your client-size bundle

| Library | Parsed size | Gzipped size |
| --- | --- | --- |
| react-query | 40.77 kb | 9.96 kb | 
| react-query-lite | 7.46 kb | 2.47 kb | 

The comparison is based on a simple setup with

```js
import { QueryClient, QueryClientProvider, useQuery } from 'react-query-lite'

const client = new QueryClient()

const App = () => (
  <QueryClientProvider client={client}>
    <Page>
  </QueryClientProvider>
)

const Page = () => {
  const { data, error, isLoading } = useQuery('cache-key', async () => {
    const data = await getDataFromApi()
    return data
  })
  return (
    <div>
      {isLoading && 'isloading'}
      {error && error.message}
      {data && 'display data'}
    </div>
  )
}

```

## Api

### Query options (Object)

Used as third parameter to `useQuery` and as `defaultOptions` to QueryClient

* keepPreviousData: Bool (default false) - keep previous data if key change in the `useQuery` hook
* cacheTime: Int (default Infinity) - how long time before returning renders of components should fetch new data

### QueryClient

#### new QueryClient({ cache, defaultOptions })

* cache: Object (default {})
* defaultOptions: Object (defaults to above Query options)

```js
const client = new QueryClient({
  cache: {
    'my-key': {
      'data': 'Hello world'
    }
  },
  defaultOptions: {
    keepPreviousData: true,
    cacheTime: 60 * 60 * 1000 // 1 hour
  }
})
```

#### prefetchQuery(queryKey, fetchFn, options)

Use to prefetch data server-side

```js
const data = await client.prefetchQuery(queryKey, fetchFn, options)
console.log(data)
```

#### getCache()

Get cache object from client that can be passed to client side QueryClient to avoid refetch

```js
const cache = client.getCache()
console.log(cache)
```

### useQuery(queryKey, fetchFn, options)

Use third option parameter to pass custom options for this query:

```js
const {
  data,
  isLoading,
  error,
  status,
  refetch,
  fetchTime
} = await useQuery(queryKey, fetchFn, {
  keepPreviousData: true,
  cacheTime: 60 * 1000 // 1 minute
})
```

## Tradeoffs compared with `react-query`

Todo..
