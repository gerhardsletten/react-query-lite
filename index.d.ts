import React from 'react';

/**
	String used as a cache key. For dynamic values use template literals.
  @example
  'post'
  `post-${id}`
*/
export type QueryKey = string;
/**
	Functon that returns data with or without a promise
  @example
  async () => {
    const res = await fetch(`/api/posts/${id}`)
    const json = await res.json()
    return json
  }
  () => {
    return 'hello world'
  }
*/
export type QueryFn<TData = unknown> = () => Promise<TData>
/**
	Data returned from your QueryFn
*/
export type QueryData = unknown;
/**
	Error thrown from QueryFn if failure
*/
export type QueryError = unknown;
/**
	Status for a query
*/
export type QueryStatus = 'loading' | 'error' | 'success'

/**
	Options object used for defaultOptions to QueryClient and useQuery hook
  @example
  {
    cacheTime: 1000 * 60 * 60, // one hour
    keepPreviousData: true
  }
*/
export interface QueryOptions {
  /**
	How long time in ms will the cached query be served before refetching it
  @default Infinity
	*/
  readonly cacheTime?: number;
  /**
	If useQuery's key change, serve the previous result until a new result has been fetched
  @default false
	*/
  readonly keepPreviousData?: boolean;
}
/**
	Item for each stored query in cache
  @example
  {
    data: {
      title: 'Hello world'
    }
  }
*/
export interface QueryCacheItem<TData = unknown> {
  readonly data: TData;
  readonly cacheTime?: number;
  readonly options?: QueryOptions;
}
/**
	Inital cache served to QueryClient
  @example
  {
    'post-1': {
      data: {
        title: 'Hello world'
      }
    },
    'post-2': {
      data: {
        title: 'Hello world 2'
      }
    },
  }
*/
export interface QueryCache {[key: string]: QueryCacheItem}
/**
	Config object used when creating a new QueryClient
  @example
  const client = new QueryClient({
    cache: {
      'post-1': {
        data: {
          title: 'Hello world'
        }
      }
    },
    defaultOptions: {
      cacheTime: 1000 * 60 * 60, // one hour
      keepPreviousData: true
    }
  })
*/
export interface QueryClientConfig {
  /**
	Inital cache for client
  @default {}
	*/
  readonly cache?: QueryCache;
  /**
	Default options for queries, can later be overrided by options passed to useQuery
  @default { cacheTime: Infinity, keepPreviousData: false }
	*/
  readonly defaultOptions?: QueryOptions;
}

/**
	Create QueryClient used to handle all queries within the app
  @example
  import { QueryClient } from 'react-query-lite'
  const client = new Client()
*/
export declare class QueryClient {
  constructor(config?: QueryClientConfig);
  /**
    Return the current cache object, used to pass the cached queries from server rendered app to client side
    @example
    const cache = client.getCache()
  */
  getCache():QueryCache;
  /**
    Clear clients cache
    @example
    client.clear()
    const cache = client.getCache()
    ==> {}
  */
  clear():void;
  /**
    Manually insert a query into cache
    @example
    client.setQueryData('post-1', {title: 'hello world'})
  */
  setQueryData<TData = unknown>(queryKey:QueryKey, data: TData):void;
  /**
    Manually insert a query into cache
    @example
    await client.prefetchQuery('post-1', () => fetch('/api/posts/1'))
  */
  prefetchQuery<TData = unknown>(queryKey: QueryKey, fetchFn: QueryFn<TData>, options?: QueryOptions): Promise<TData>;
}

/**
  Hook to access the queryClient within your react-tree
  @example
  import { useQueryClient } from 'react-query-lite'

  function Comp() {
    const client = useQueryClient()
    ruturn null
  }
*/
export declare const useQueryClient: () => QueryClient;
export interface QueryClientProviderProps {
    client: QueryClient;
}
/**
  Provider to wrap your App with
  @example
  import { QueryClient, QueryClientProvider } from 'react-query-lite'
  const client = new QueryClient()
  function Root() {
    ruturn (
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    )
  }
*/
export declare const QueryClientProvider: React.FC<QueryClientProviderProps>;

export type UseQueryReturnValue<TData, TError> = {
  /**
    Is the query currently loading
  */
  readonly isLoading: boolean;
  /**
    Data returned from your queryFn
  */
  readonly data: TData;
  /**
    The status for the query
  */
  readonly status: QueryStatus;
  /**
    The error if queryFn throws
  */
  readonly error: TError;
  /**
    Function to force a refetch the query
  */
  readonly refetch: () => void;
  /**
    Time stamp when query was fetched
  */
  readonly fetchTime: number;
}
/**
  Hook used to fetch queries
  @example
  import { useQuery } from 'react-query-lite'
  function Post(id) {
    const { isLoading, error, data } = useQuery(`post-${id}`, () => fetchPost(id))
    // Handle loading, error and data…
  }
*/
export function useQuery<
TData = unknown,
TError = unknown
>(queryKey: QueryKey, fetchFn: QueryFn<TData>, options?: QueryOptions): UseQueryReturnValue<TData, TError>;

/* Mutation */

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables?: TVariables
) => Promise<TData>

export type useMutationReturnValue<
TData = unknown,
TError = unknown,
TVariables = unknown
> = {
  /**
    Is the mutation currently loading
  */
  readonly isLoading: boolean;
  /**
    Data returned from your queryFn
  */
  readonly data: TData;
  /**
    The error if queryFn throws
  */
  readonly error: TError;
  /**
    Function that calls 
  */
  readonly mutateAsync: MutationFunction<TData, TVariables> ;
}
/**
  Hook used to perform a mutation
  @example
  import { useMutation } from 'react-query-lite'
  const myMutation = async ({ username, passord }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, passord })
      })
      const json = await res.json()
      return json
    })

  function Post(id) {
    const { isLoading, error, data, mutateAsync } = useQuery(`post-${id}`, () => fetchPost(id))
    const action = async () => {
      await mutateAsync({username: 'user', password: 'pass' })
    }
    // Handle loading, error and data…
  }
*/
export function useMutation<
TData = unknown,
TError = unknown,
TVariables = unknown
>(mutationFn: MutationFunction<TData, TVariables>): useMutationReturnValue<TData, TError, TVariables>;
