import { SgHttpRoute } from 'types/route';
import request, { IResponse } from '../../index'
import { GetHttpRouteParams } from './type';

export const getHttpRouteApi = (params?: GetHttpRouteParams): Promise<IResponse<SgHttpRoute[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/httproute', params })
}

export const addHttpRouteApi = (data: SgHttpRoute): Promise<IResponse<SgHttpRoute>> => {
  return request.post({ url: '/httproute', data })
}

export const updateHttpRouteApi = (data: SgHttpRoute): Promise<IResponse<SgHttpRoute>> => {
  return request.put({ url: '/httproute', data })
}

export const deleteHttpRouteApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/httproute' + '/' + paramName })
}