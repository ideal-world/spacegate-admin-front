import { InstConfigVo } from 'types/instance'
import request, { IResponse } from '../../index'
import { GetInstanceParams } from './type'


export const getSelectInstance = (): Promise<IResponse<string>> => {
  return request.get({ url: '/spacegate' })
}

export const selectInstanceApi = (name: string): Promise<IResponse<string>> => {
  return request.post({ url: '/spacegate', params: { name } })
}

export const getInstanceList = (params?: GetInstanceParams): Promise<IResponse<InstConfigVo[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/spacegate/manage', params })
}