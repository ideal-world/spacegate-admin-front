import { Gateway } from 'types/service'
import request, { IResponse } from '../../index'
import { AddGateway, DeleteGatewayParams, GetGatewayParams } from './type'

export const getGatewaysApi = (params: GetGatewayParams): Promise<IResponse<Gateway[]>> => {
  params.hostname = params.hostname || undefined;
  params.port = params.port || undefined;
  params.name = params.name || undefined;
  params.namespace = params.namespace || undefined;
  return request.get({ url: '/gateway', params })
}

export const addGatewaysApi = (data: AddGateway, namespace?: string): Promise<IResponse<Gateway[]>> => {
  return request.post({ url: '/gateway', params: { namespace: namespace || undefined }, data })
}

export const deleteGatewaysApi = (params: DeleteGatewayParams): Promise<IResponse<Gateway[]>> => {
  params.namespace = params.namespace || undefined;
  return request.delete({ url: '/gateway', params })
}