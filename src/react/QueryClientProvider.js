import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'

const QueryClientContext = createContext()

export function useQueryClient() {
  const client = useContext(QueryClientContext)
  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }
  return client
}

export const QueryClientProvider = ({ children, client }) => {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}

QueryClientProvider.propTypes = {
  children: PropTypes.node,
  client: PropTypes.object,
}

export default QueryClientProvider
