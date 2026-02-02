import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
})



api.interceptors.response.use(
  res => res,
  error => {
    if (typeof window !== "undefined") {
      const status = error.response?.status

      if (status === 401) {
        window.location.href = "/login"
      }

      if (status === 403) {
        window.location.href = "/unauthorized"
      }
    }

    return Promise.reject(error)
  }
)
