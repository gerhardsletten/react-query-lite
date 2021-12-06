import ReactDOM from 'react-dom'
import { notifyManager } from './core/notifyManager'

notifyManager.setBatchNotifyFunction(ReactDOM.unstable_batchedUpdates)

export { default as QueryClient } from './core/QueryClient'
export {
  default as QueryClientProvider,
  useQueryClient,
} from './react/QueryClientProvider'
export { default as useQuery } from './react/use-query'
export { default as useMutation } from './react/use-mutation'
