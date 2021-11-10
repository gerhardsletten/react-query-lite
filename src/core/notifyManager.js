function scheduleMicrotask(callback) {
  Promise.resolve()
    .then(callback)
    .catch((error) =>
      setTimeout(() => {
        throw error
      })
    )
}

class NotifyManager {
  constructor() {
    this.queue = []
    this.transactions = 0
    this.notifyFn = (callback) => {
      callback()
    }
    this.batchNotifyFn = (callback) => {
      callback()
    }
  }

  batch(callback) {
    this.transactions++
    const result = callback()
    this.transactions--
    if (!this.transactions) {
      this.flush()
    }
    return result
  }

  schedule(callback) {
    if (this.transactions) {
      this.queue.push(callback)
    } else {
      scheduleMicrotask(() => {
        this.notifyFn(callback)
      })
    }
  }
  batchCalls(callback) {
    return (...args) => {
      this.schedule(() => {
        callback(...args)
      })
    }
  }

  flush() {
    const queue = this.queue
    this.queue = []
    if (queue.length) {
      scheduleMicrotask(() => {
        this.batchNotifyFn(() => {
          queue.forEach((callback) => {
            this.notifyFn(callback)
          })
        })
      })
    }
  }
  setNotifyFunction(fn) {
    this.notifyFn = fn
  }
  setBatchNotifyFunction(fn) {
    this.batchNotifyFn = fn
  }
}

// SINGLETON

export const notifyManager = new NotifyManager()
