import { Service } from '../../../types/service'
import request, { IResponse } from '../../index'
import { AddGateway, GetGatewayParams, GetGatewayParamsVO, converVOToGetGatewayParams } from './type'

export const getGatewaysApi = (paramsVo?: GetGatewayParamsVO): Promise<IResponse<Service[]>> => {
  let params = converVOToGetGatewayParams(paramsVo)
  return request.get({ url: '/gateway', params })
}

export const addGatewaysApi = (data: AddGateway): Promise<IResponse<Service>> => {
  return request.post({ url: '/gateway', data })
}

export const updateGatewaysApi = (data: Service): Promise<IResponse<Service>> => {
  return request.put({ url: '/gateway', data })
}

export const deleteGatewaysApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/gateway' + '/' + paramName })
}