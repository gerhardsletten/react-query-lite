import {expectType} from 'tsd'
import React from 'react'

import { QueryClient, QueryCache, QueryClientConfig, QueryOptions, QueryClientProvider, useQueryClient, QueryClientProviderProps, useQuery, UseQueryReturnValue, useMutation, useMutationReturnValue } from '.'

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
expectType<Promise<string>>(
	client.prefetchQuery('key2', async () => 'hello', options)
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

expectType<UseQueryReturnValue<string, unknown>>(
	useQuery('key-1', async () => 'data')
)
expectType<UseQueryReturnValue<string, unknown>>(
	useQuery('key-1', async () => 'data', {
    cacheTime: 1000
  })
)
expectType<UseQueryReturnValue<string, unknown>>(
	useQuery('key-1', async () => 'data', {
    cacheTime: 1000
  })
)

interface Post {
  readonly title: string;
}

function mutationFn(postId?: number):Promise<Post> {
  return Promise.resolve({
    title: 'hello world'
  })
}

const mutation = useMutation(mutationFn)

expectType<useMutationReturnValue<Post, unknown, number>>(
	mutation
)

expectType<Promise<Post>>(
	mutation.mutateAsync(1)
)
