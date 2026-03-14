import axios, { AxiosRequestConfig } from "axios"

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

// 响应拦截器：统一数据处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一处理错误信息
    const message = error.response?.data?.detail || error.message || "请求失败"
    return Promise.reject(new Error(message))
  }
)

// Orval 专用的 Mutator
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return apiClient(config);
};
