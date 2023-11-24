
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance,
  AxiosRequestHeaders,
  AxiosError
} from 'axios'

declare type AxiosHeaders =
| 'application/json'
| 'application/x-www-form-urlencoded'
| 'multipart/form-data'


interface AxiosConfig<T = AxiosResponse> {
  code: number
  defaultHeaders: AxiosHeaders
  timeout: number
}

const config: AxiosConfig = {

  /**
   * 接口成功返回状态码
   */
  code: 200,

  /**
   * 接口请求超时时间
   */
  timeout: 6000,

  /**
   * 默认接口请求类型
   * 可选值：application/x-www-form-urlencoded multipart/form-data
   */
  defaultHeaders: 'application/json',
}



export default config