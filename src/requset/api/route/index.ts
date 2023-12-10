import { SgHttpRoute } from 'types/route';
import request, { IResponse } from '../../index'
import { GetHttpRouteParamsVO, converVOToGetHttpRouteParams } from './type';

export const getHttpRouteApi = (paramsVo?: GetHttpRouteParamsVO): Promise<IResponse<SgHttpRoute[]>> => {
  let params = converVOToGetHttpRouteParams(paramsVo)
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