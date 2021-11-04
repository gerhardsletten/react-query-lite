import { createContext, useContext } from 'react'

const QueryClientContext = createContext()

export function useQueryClient() {
  const queryClient = useContext(QueryClientContext)
  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }
  return queryClient
}

export const QueryClientProvider = ({ children, queryClient }) => {
  return (
    <QueryClientContext.Provider value={queryClient}>
      {children}
    </QueryClientContext.Provider>
  )
}

export default QueryClientProvider
