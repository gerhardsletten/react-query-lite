export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
let queryKeyCount = 0
export function queryKey() {
  queryKeyCount++
  return `query_${queryKeyCount}`
}
