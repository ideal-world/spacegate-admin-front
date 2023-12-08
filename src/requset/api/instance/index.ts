import { InstConfig, SelectedInstance } from 'types/instance'
import request, { IResponse } from '../../index'
import { GetInstanceParams } from './type'


export const getSelectedInstanceApi = (): Promise<IResponse<SelectedInstance>> => {
  return request.get({ url: '/spacegate' })
}

export const selectInstanceApi = (name: string): Promise<IResponse<string>> => {
  return request.post({ url: '/spacegate', params: { name } })
}

export const getInstanceListApi = (params?: GetInstanceParams): Promise<IResponse<InstConfig[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/spacegate/manage', params })
}

export const addInstanceListApi = (data: InstConfig): Promise<IResponse<InstConfig>> => {
  return request.post({ url: '/spacegate/manage', data })
}

export const updateInstanceListApi = (data: InstConfig): Promise<IResponse<InstConfig>> => {
  return request.put({ url: '/spacegate/manage', data })
}

export const deleteInstanceApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/gateway' + '/' + paramName })
}