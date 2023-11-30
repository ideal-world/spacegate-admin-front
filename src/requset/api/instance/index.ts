import { InstConfigVo, SelectedInstance } from 'types/instance'
import request, { IResponse } from '../../index'
import { GetInstanceParams } from './type'


export const getSelectedInstanceApi = (): Promise<IResponse<SelectedInstance>> => {
  return request.get({ url: '/spacegate' })
}

export const selectInstanceApi = (name: string): Promise<IResponse<string>> => {
  return request.post({ url: '/spacegate', params: { name } })
}

export const getInstanceListApi = (params?: GetInstanceParams): Promise<IResponse<InstConfigVo[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/spacegate/manage', params })
}