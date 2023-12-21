import { SgCommonService } from '../../../service'
import { Statistics } from '../../../types/common'
import request, { IResponse } from '../../index'

export const getStatisticsApi = (): Promise<IResponse<Statistics>> => {
  return request.get({ url: '/dashboard/statistics' })
}

export class DefaultCommonService implements SgCommonService {
  getStatistics(): Promise<IResponse<Statistics>> {
    return getStatisticsApi()
  }
}
  