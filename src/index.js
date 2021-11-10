import ReactDOM from 'react-dom'
import { notifyManager } from './core/notifyManager'
export { default as QueryClient } from './core/QueryClient'
export { default as QueryObserver } from './core/QueryObserver'
export {
  default as QueryClientProvider,
  useQueryClient,
} from './react/QueryClientProvider'
export { default as useQuery } from './react/use-query'

notifyManager.setBatchNotifyFunction(ReactDOM.unstable_batchedUpdates)
