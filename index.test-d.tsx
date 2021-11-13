import {expectType} from 'tsd'
import React from 'react'

import { QueryClient, QueryCache, QueryClientConfig, QueryOptions, QueryData, QueryError, QueryClientProvider, useQueryClient, QueryClientProviderProps, useQuery, UseQueryReturnValue } from '.'

const cache:QueryCache = {
  'key1': {
    data: 'hello',
    cacheTime: 1000,
    options: {
      keepPreviousData: true,
    }
  }
}
expectType<QueryCache>(
	cache
)
const options:QueryOptions = {
  cacheTime: 1000,
  keepPreviousData: true
}
expectType<QueryOptions>(
	options
)
const config:QueryClientConfig = {
  defaultOptions: options,
  cache: cache
}
expectType<QueryClientConfig>(
	config
)
const client = new QueryClient(config)
expectType<QueryClient>(
	client
)
expectType<QueryCache>(
	client.getCache()
)
expectType<void>(
	client.clear()
)
expectType<void>(
	client.setQueryData('key2', 'hello')
)
expectType<Promise<QueryData|QueryError>>(
	client.prefetchQuery('key2', () => 'hello', options)
)

expectType<QueryClient>(
	useQueryClient()
)

const providerProps = {
  client: client
}

expectType<QueryClientProviderProps>(
	providerProps
)

expectType<JSX.Element>(
	<QueryClientProvider {...providerProps}>
    Hello
  </QueryClientProvider>
)

expectType<UseQueryReturnValue>(
	useQuery('key-1', () => 'data')
)
expectType<UseQueryReturnValue>(
	useQuery('key-1', () => 'data', {
    cacheTime: 1000
  })
)
