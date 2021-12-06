import { useReducer, useCallback, useRef } from 'react'

const initialState = {
  isLoading: false,
  data: undefined,
  error: undefined,
}

const LOAD = 'LOAD'
const LOAD_ERROR = 'LOAD_ERROR'
const LOAD_SUCCESS = 'LOAD_SUCCESS'

function reducer(state, action) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        isLoading: true,
        error: undefined,
      }
    case LOAD_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      }
    case LOAD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        data: action.data,
      }
    default:
      return state
  }
}

function useMutation(fn) {
  const fnRef = useRef(fn)
  const [state, dispatch] = useReducer(reducer, initialState)
  const mutateAsync = useCallback(
    async (params) => {
      dispatch({ type: LOAD })
      try {
        const data = await fnRef.current(params)
        dispatch({ type: LOAD_SUCCESS, data })
        return data
      } catch (error) {
        dispatch({ type: LOAD_ERROR, error })
        throw error
      }
    },
    [dispatch, fnRef]
  )
  return {
    ...state,
    mutateAsync,
  }
}

export default useMutation
