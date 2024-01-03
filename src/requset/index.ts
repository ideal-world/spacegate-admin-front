import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import config from './config'
import { ElMessage } from 'element-plus';
import qs from 'qs';

declare type AxiosMethod = 'get' | 'post' | 'delete' | 'put'

declare type AxiosResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

declare interface AxiosConfig {
  params?: any
  data?: any
  url?: string
  method?: AxiosMethod
  headersType?: string
  responseType?: AxiosResponseType
}

declare interface IResponse<T = any> {
  code: string
  data: T extends any ? T : T & any
  msg: string
}

let apiClient = axios.create({
  ...config,
  baseURL: import.meta.env.VITE_API_BASE_PATH
})
type SetAxiosFunc = () => AxiosInstance;
/**
 * Sets the API client to be used for making API requests.
 *
 * @param {SetAxiosFunc} getApiClient - A function that returns the API client.
 * @return {void}
 */
export const setApiClient = (getApiClient: SetAxiosFunc) => { apiClient = getApiClient(); }

apiClient.defaults.withCredentials = true

const defaultRequestInterceptors = (config: InternalAxiosRequestConfig) => {
  if (
    config.method === 'post' &&
    (config.headers as AxiosRequestHeaders)['Content-Type'] === 'application/x-www-form-urlencoded'
  ) {
    config.data = qs.stringify(config.data)
  }
  if (config.method === 'get' && config.params) {
    let url = config.url as string
    url += '?'
    const keys = Object.keys(config.params)
    for (const key of keys) {
      if (config.params[key] !== void 0 && config.params[key] !== null) {
        url += `${key}=${encodeURIComponent(config.params[key])}&`
      }
    }
    url = url.substring(0, url.length - 1)
    config.params = {}
    config.url = url
  }
  return config
}
  ; (error: AxiosError) => {
    console.log(error)
    Promise.reject(error)
  }

const defaultResponseInterceptors = (response: AxiosResponse<any>) => {
  if (response?.config?.responseType === 'blob') {
    // 如果是文件流，直接过
    return response
  } else if (response.data.code == config.code) {
    return response.data
  } else {
    ElMessage.error(response.data.msg)
  }
}
  ; (error: AxiosError) => {
    console.log('err' + error) // for debug
    ElMessage.error(error.message)
    return Promise.reject(error)
  }

const abortControllerMap: Map<string, AbortController> = new Map()
apiClient.interceptors.request.use((res: InternalAxiosRequestConfig) => {
  const controller = new AbortController()
  const url = res.url || ''
  res.signal = controller.signal
  abortControllerMap.set(url, controller)
  return res
})

apiClient.interceptors.response.use(
  (res: AxiosResponse) => {
    const url = res.config.url || ''
    abortControllerMap.delete(url)
    return res
  },
  (err: any) => err
)

apiClient.interceptors.request.use(defaultRequestInterceptors)
apiClient.interceptors.response.use(defaultResponseInterceptors)

const service = {
  request: (config: AxiosRequestConfig) => {
    return new Promise((resolve, reject) => {

      apiClient
        .request(config)
        .then((res) => {
          console.debug("apiClient raw resp:", res)
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  },
  cancelRequest: (url: string | string[]) => {
    const urlList = Array.isArray(url) ? url : [url]
    for (const _url of urlList) {
      abortControllerMap.get(_url)?.abort()
      abortControllerMap.delete(_url)
    }
  },
  cancelAllRequest() {
    for (const [_, controller] of abortControllerMap) {
      controller.abort()
    }
    abortControllerMap.clear()
  }
}

const request = (option: AxiosConfig) => {
  const { url, method, params, data, headersType, responseType } = option
  return service.request({
    url: url,
    method,
    params,
    data,
    responseType: responseType,
    headers: {
      'Content-Type': headersType || config.defaultHeaders
    }
  })
}

export type { IResponse }

export default {
  get: <T = any>(option: AxiosConfig) => {
    return request({ method: 'get', ...option }) as Promise<IResponse<T>>
  },
  post: <T = any>(option: AxiosConfig) => {
    return request({ method: 'post', ...option }) as Promise<IResponse<T>>
  },
  delete: <T = any>(option: AxiosConfig) => {
    return request({ method: 'delete', ...option }) as Promise<IResponse<T>>
  },
  put: <T = any>(option: AxiosConfig) => {
    return request({ method: 'put', ...option }) as Promise<IResponse<T>>
  },
  cancelRequest: (url: string | string[]) => {
    return service.cancelRequest(url)
  },
  cancelAllRequest: () => {
    return service.cancelAllRequest()
  }
}

