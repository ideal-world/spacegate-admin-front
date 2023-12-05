import { SgPlugin } from 'types/plugin';
import request, { IResponse } from '../../index'
import { GetPluginParams } from './type';

export const getPluginApi = (params?: GetPluginParams): Promise<IResponse<SgPlugin[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/plugin', params })
}

export const addPluginApi = (data: SgPlugin): Promise<IResponse<SgPlugin>> => {
  return request.post({ url: '/plugin', data })
}

export const updatePluginApi = (data: SgPlugin): Promise<IResponse<SgPlugin>> => {
  return request.put({ url: '/plugin', data })
}

export const deletePluginApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/backend' + '/' + paramName })
}