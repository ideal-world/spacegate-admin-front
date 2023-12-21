import { SgCertificateService } from '../../../service';
import { TlsCert } from '../../../types/certificate';
import request, { IResponse } from '../../index'
import { GetTlsCertParams } from './type';

export const getTlsCertApi = (params?: GetTlsCertParams): Promise<IResponse<TlsCert[]>> => {
  if (params) {
    params.names = params.names || undefined
  }
  return request.get({ url: '/tls', params })
}

export const addTlsCertApi = (data: TlsCert): Promise<IResponse<TlsCert>> => {
  return request.post({ url: '/tls', data })
}

export const updateTlsCertApi = (data: TlsCert): Promise<IResponse<TlsCert>> => {
  return request.put({ url: '/tls', data })
}

export const deleteTlsCertApi = (paramName: string): Promise<IResponse<void>> => {
  return request.delete({ url: '/tls' + '/' + paramName })
}

export class DefaultCertificateService implements SgCertificateService {
  getTlsCert(params?: GetTlsCertParams): Promise<IResponse<TlsCert[]>> {
    return getTlsCertApi(params)
  }
  addTlsCert(data: TlsCert): Promise<IResponse<TlsCert>> {
    return addTlsCertApi(data)
  }
  updateTlsCert(data: TlsCert): Promise<IResponse<TlsCert>> {
    return updateTlsCertApi(data)
  }
  deleteTlsCert(paramName: string): Promise<IResponse<void>> {
    return deleteTlsCertApi(paramName)
  }
}
