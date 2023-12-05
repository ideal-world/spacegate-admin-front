import { Service } from 'types/service'
import request, { IResponse } from '../../index'
import { AddGateway, DeleteGatewayParams, GetGatewayParams } from './type'

export const getGatewaysApi = (params: GetGatewayParams): Promise<IResponse<Service[]>> => {
  params.hostname = params.hostname || undefined;
  params.port = params.port || undefined;
  params.name = params.name || undefined;
  params.namespace = params.namespace || undefined;
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