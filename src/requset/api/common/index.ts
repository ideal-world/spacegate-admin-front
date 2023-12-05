import { Statistics } from 'types/common'
import request, { IResponse } from '../../index'

export const getStatisticsApi = (): Promise<IResponse<Statistics>> => {
  return request.get({ url: '/dashboard/statistics' })
}