import { SgPluginService } from '../../../service';
import { SgPlugin } from '../../../types/plugin';
import request, { IResponse } from '../../index'
import { GetPluginParams } from './type';

export const getPluginApi = (params?: GetPluginParams): Promise<IResponse<SgPlugin[]>> => {
  if (params) {
    params.ids = params.ids || undefined
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
  return request.delete({ url: '/plugin' + '/' + paramName })
}

export class DefaultPluginService implements SgPluginService {
  getPlugin(params?: GetPluginParams): Promise<IResponse<SgPlugin[]>> {
    return getPluginApi(params)
  }
  addPlugin(data: SgPlugin): Promise<IResponse<SgPlugin>> {
    return addPluginApi(data)
  }
  updatePlugin(data: SgPlugin): Promise<IResponse<SgPlugin>> {
    return updatePluginApi(data)
  }
  deletePlugin(paramName: string): Promise<IResponse<void>> {
    return deletePluginApi(paramName)
  }
}