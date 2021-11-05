import { render, waitFor } from '@testing-library/react'

import { sleep, queryKey } from '../../core/tests/utils'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '../..'

describe('QueryClientProvider', () => {
  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()
    const client = new QueryClient()
    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    const rendered = render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )
    await waitFor(() => rendered.getByText('test'))
    expect(client.getCache()[key]).toBeDefined()
  })
  describe('useQueryClient', () => {
    test('should throw an error if no query client has been set', () => {
      const consoleMock = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(<Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one'
      )

      consoleMock.mockRestore()
    })
    test('Should pass queryClient from hook', () => {
      const client = new QueryClient()
      let queryClientFromHook
      function Page() {
        queryClientFromHook = useQueryClient()
        return null
      }
      render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>
      )
      expect(queryClientFromHook).toEqual(client)
    })
  })
})
