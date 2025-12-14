export interface ApiErrorInterface extends Error {
  status: number
}

export function ApiError(status: number, message: string): ApiErrorInterface {
  const e = new Error(message) as ApiErrorInterface
  e.status = status
  return e
}