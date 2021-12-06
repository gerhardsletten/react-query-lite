import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'

import { useMutation } from '../..'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const fnPayload = {
  message: 'hello',
  number: 19,
  float: 15.5,
}
const fnArgs = {
  message: 'hello',
  number: 19,
  float: 15.5,
}

describe('useMutation', () => {
  test('mutateAsync should pass params and return data', async () => {
    const states = []
    const myMutation = jest.fn(async () => {
      await sleep(20)
      return fnPayload
    })
    function Page() {
      const { mutateAsync, data } = useMutation(myMutation)
      const action = async () => {
        const payload = await mutateAsync(fnArgs)
        states.push(payload)
      }
      return (
        <div>
          {data && <p>done</p>}
          <button onClick={action}>Run</button>
        </div>
      )
    }
    const rendered = render(<Page />)
    fireEvent.click(rendered.getByText('Run'))
    await waitFor(() => rendered.getByText('done'))
    expect(states[0]).toMatchObject(fnPayload)
    expect(myMutation).toHaveBeenCalledTimes(1)
    expect(myMutation).toHaveBeenCalledWith(fnArgs)
  })
  test('mutateAsync should throw on error', async () => {
    const states = []
    const myError = 'My error'
    const myMutation = jest.fn(async () => {
      await sleep(20)
      throw new Error(myError)
    })
    function Page() {
      const { mutateAsync, error } = useMutation(myMutation)
      const action = async () => {
        try {
          await mutateAsync(fnArgs)
        } catch (error) {
          states.push(error)
        }
      }
      return (
        <div>
          {error && <p>{error.message}</p>}
          <button onClick={action}>Run</button>
        </div>
      )
    }
    const rendered = render(<Page />)
    fireEvent.click(rendered.getByText('Run'))
    await waitFor(() => rendered.getByText(myError))
    expect(states.length).toEqual(1)
    expect(states[0]).toEqual(new Error(myError))
    expect(states[0].message).toEqual(myError)
    expect(myMutation).toHaveBeenCalledTimes(1)
    expect(myMutation).toHaveBeenCalledWith(fnArgs)
  })
  test('useMutation hooks should return corrent state', async () => {
    const states = []
    const myMutation = jest.fn(async () => {
      await sleep(20)
      return fnPayload
    })
    function Page() {
      const { mutateAsync, ...state } = useMutation(myMutation)
      const action = async () => {
        await mutateAsync(fnArgs)
      }
      states.push(state)
      return (
        <div>
          {state.data && <p>done</p>}
          <button onClick={action}>Run</button>
        </div>
      )
    }
    const rendered = render(<Page />)
    expect(states.length).toEqual(1)
    fireEvent.click(rendered.getByText('Run'))
    await waitFor(() => rendered.getByText('done'))
    expect(states.length).toEqual(3)
    expect(states).toMatchObject([
      {
        isLoading: false,
        data: undefined,
        error: undefined,
      },
      {
        isLoading: true,
        data: undefined,
        error: undefined,
      },
      {
        isLoading: false,
        data: fnPayload,
        error: undefined,
      },
    ])
  })
  test('useMutation hooks should return corrent error state', async () => {
    const states = []
    const myError = 'My error'
    const myMutation = jest.fn(async () => {
      await sleep(20)
      throw new Error(myError)
    })
    function Page() {
      const { mutateAsync, ...state } = useMutation(myMutation)
      const action = async () => {
        try {
          await mutateAsync(fnArgs)
        } catch (error) {
          // error
        }
      }
      states.push(state)
      return (
        <div>
          {state.error && <p>{state.error.message}</p>}
          <button onClick={action}>Run</button>
        </div>
      )
    }
    const rendered = render(<Page />)
    expect(states.length).toEqual(1)
    fireEvent.click(rendered.getByText('Run'))
    await waitFor(() => rendered.getByText(myError))
    expect(states.length).toEqual(3)
    expect(states).toMatchObject([
      {
        isLoading: false,
        data: undefined,
        error: undefined,
      },
      {
        isLoading: true,
        data: undefined,
        error: undefined,
      },
      {
        isLoading: false,
        data: undefined,
        error: new Error(myError),
      },
    ])
  })
  test('useMutation should allow putting in local state', async () => {
    const states = []
    const myError = 'My error'
    const myMutation = jest.fn(async () => {
      await sleep(20)
      throw new Error(myError)
    })
    function Page() {
      const [err, setErr] = React.useState()
      const { mutateAsync } = useMutation(myMutation)
      const action = async () => {
        try {
          await mutateAsync(fnArgs)
        } catch (error) {
          setErr(error)
        }
      }
      states.push(err)
      return (
        <div>
          {err && <p>{err.message}</p>}
          <button onClick={action}>Run</button>
        </div>
      )
    }
    const rendered = render(<Page />)
    fireEvent.click(rendered.getByText('Run'))
    await waitFor(() => rendered.getByText(myError))
    expect(states.length).toEqual(4)
    expect(states).toMatchObject([
      undefined,
      undefined,
      undefined,
      new Error(myError),
    ])
  })
})
