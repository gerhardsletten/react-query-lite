import React from 'react'
import PropTypes from 'prop-types'
import { invariant } from '../core/utils'

const QueryClientContext = React.createContext()

export function useQueryClient() {
  const client = React.useContext(QueryClientContext)
  invariant(client, 'No QueryClient set, use QueryClientProvider to set one')
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
