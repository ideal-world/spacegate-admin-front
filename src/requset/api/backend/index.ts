import { Backend } from 'types/backend';
import request, { IResponse } from '../../index'
import { GetBackendParams } from './type';

export const getBackendApi = (params?: GetBackendParams): Promise<IResponse<Backend[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/backend', params })
}

export const addBackendApi = (data: Backend): Promise<IResponse<Backend>> => {
  return request.post({ url: '/backend', data })
}

export const updateBackendApi = (data: Backend): Promise<IResponse<Backend>> => {
  return request.put({ url: '/backend', data })
}

export const deleteBackendApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/backend', params: { name: paramName } })
}